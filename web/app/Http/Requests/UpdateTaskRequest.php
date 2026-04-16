<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateTaskRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('update', $this->route('task'));
    }

    public function rules(): array
    {
        $task = $this->route('task');

        return [
            'title'        => ['sometimes', 'required', 'string', 'max:255'],
            'description'  => ['sometimes', 'required', 'string'],
            'project_id'   => ['sometimes', 'required', 'integer', 'exists:projects,id'],
            'phase_id'     => [
                'nullable', 'integer',
                function ($attribute, $value, $fail) {
                    $projectId = $this->input('project_id') ?? $this->route('task')->project_id;
                    if (!\DB::table('project_phases')->where('id', $value)->where('project_id', $projectId)->exists()) {
                        $fail("The selected phase does not belong to the selected project.");
                    }
                }
            ],
            'milestone_id' => [
                'nullable', 'integer',
                function ($attribute, $value, $fail) {
                    $projectId = $this->input('project_id') ?? $this->route('task')->project_id;
                    if (!\DB::table('project_milestones')->where('id', $value)->where('project_id', $projectId)->exists()) {
                        $fail("The selected milestone does not belong to the selected project.");
                    }
                }
            ],
            'assigned_to'  => ['sometimes', 'required', 'integer', 'exists:users,id'],
            'priority'     => ['sometimes', 'required', Rule::in(['low', 'medium', 'high', 'urgent'])],
            'status'       => ['sometimes', 'required', Rule::in(['todo', 'in_progress', 'in_review', 'completed'])],
            'start_date'   => ['nullable', 'date'],
            'due_date'     => ['sometimes', 'required', 'date', 'after_or_equal:start_date'],
            'attachments'  => ['sometimes', 'nullable', 'array'],
            'attachments.*' => [
                'file',
                'max:10240',
                'mimes:pdf,doc,docx,xls,xlsx,jpg,jpeg,png',
            ],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            $task        = $this->route('task');
            $milestoneId = $this->input('milestone_id');
            $phaseId     = $this->input('phase_id', $task->phase_id);

            if ($milestoneId && $phaseId) {
                $exists = \App\Models\ProjectMilestone::where('id', $milestoneId)
                    ->where('project_id', $task->project_id)
                    ->where('project_phase_id', $phaseId)
                    ->exists();

                if (! $exists) {
                    $validator->errors()->add(
                        'milestone_id',
                        'The selected milestone does not belong to the selected phase.'
                    );
                }
            }
        });
    }
}
