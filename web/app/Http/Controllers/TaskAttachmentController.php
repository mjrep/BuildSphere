<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreTaskAttachmentRequest;
use App\Models\Task;
use App\Models\TaskAttachment;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;

class TaskAttachmentController extends Controller
{
    /**
     * GET /api/tasks/{task}/attachments
     */
    public function index(Task $task): JsonResponse
    {
        $this->authorize('view', $task);

        $attachments = $task->attachments()
            ->with('uploader:id,first_name,last_name')
            ->orderBy('created_at')
            ->get()
            ->map(fn ($a) => [
                'id'           => $a->id,
                'file_name'    => $a->file_name,
                'file_type'    => $a->file_type,
                'file_size'    => $a->file_size,
                'created_at'   => $a->created_at?->toIso8601String(),
                'uploader'     => [
                    'id'   => $a->uploader->id,
                    'name' => $a->uploader->first_name . ' ' . $a->uploader->last_name,
                ],
                'download_url' => sprintf(
                    '%s/storage/v1/object/public/%s/%s',
                    env('SUPABASE_URL'),
                    env('SUPABASE_BUCKET_ATTACHMENTS', 'task-attachments'),
                    ltrim($a->file_path, '/')
                ),
            ]);

        return response()->json(['data' => $attachments]);
    }

    /**
     * POST /api/tasks/{task}/attachments
     */
    public function store(StoreTaskAttachmentRequest $request, Task $task): JsonResponse
    {
        $created = [];

        foreach ($request->file('files') as $file) {
            // Store to Supabase
            $path = $file->store('', [
                'disk' => 'supabase',
            ]);

            $attachment = $task->attachments()->create([
                'file_name'   => $file->getClientOriginalName(),
                'file_path'   => $path,
                'file_type'   => $file->getMimeType(),
                'file_size'   => $file->getSize(),
                'uploaded_by' => $request->user()->id,
            ]);

            $attachment->load('uploader:id,first_name,last_name');

            $created[] = [
                'id'           => $attachment->id,
                'file_name'    => $attachment->file_name,
                'file_type'    => $attachment->file_type,
                'file_size'    => $attachment->file_size,
                'created_at'   => $attachment->created_at?->toIso8601String(),
                'uploader'     => [
                    'id'   => $attachment->uploader->id,
                    'name' => $attachment->uploader->first_name . ' ' . $attachment->uploader->last_name,
                ],
                'download_url' => sprintf(
                    '%s/storage/v1/object/public/%s/%s',
                    env('SUPABASE_URL'),
                    env('SUPABASE_BUCKET_ATTACHMENTS', 'task-attachments'),
                    ltrim($attachment->file_path, '/')
                ),
            ];
        }

        if ($task->status === 'todo') {
            $task->update([
                'status' => 'in_progress',
                'updated_by' => $request->user()->id,
            ]);
        }

        return response()->json(['data' => $created], 201);
    }

    /**
     * GET /api/tasks/{task}/attachments/{attachment}/download
     * Named: task.attachment.download
     */
    public function download(Task $task, TaskAttachment $attachment): mixed
    {
        abort_unless($attachment->task_id === $task->id, 404);
        $this->authorize('view', $task);

        $publicUrl = sprintf(
            '%s/storage/v1/object/public/%s/%s',
            env('SUPABASE_URL'),
            env('SUPABASE_BUCKET_ATTACHMENTS', 'task-attachments'),
            ltrim($attachment->file_path, '/')
        );

        return redirect($publicUrl);
    }
}
