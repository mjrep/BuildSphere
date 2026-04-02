<?php

namespace App\Services;

use App\Enums\ProjectStatus;
use App\Enums\ProjectSubStatus;
use App\Models\Project;
use App\Models\ProjectActivityLog;
use App\Models\ProjectApproval;
use App\Models\ProjectPhase;
use App\Models\ProjectRevision;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class ProjectService
{
    /**
     * Create a new project with PROPOSED status.
     */
    public function createProject(array $data, User $user): Project
    {
        return DB::transaction(function () use ($data, $user) {
            $project = Project::create([
                ...$data,
                'status'     => ProjectStatus::PROPOSED->value,
                'sub_status' => ProjectSubStatus::DRAFT->value,
                'created_by' => $user->id,
            ]);

            $this->logActivity($project, $user, 'PROJECT_CREATED', 'Project was created and proposed.');

            return $project;
        });
    }

    /**
     * Save milestone plan (draft) — does NOT change project status.
     */
    public function saveMilestonePlan(Project $project, array $phases, User $user): Project
    {
        return DB::transaction(function () use ($project, $phases, $user) {
            // Delete existing phases + milestones (cascade)
            $project->phases()->delete();

            foreach ($phases as $seqIndex => $phaseData) {
                $phase = $project->phases()->create([
                    'phase_key'         => $phaseData['phase_key'],
                    'sequence_no'       => $seqIndex + 1,
                    'weight_percentage' => $phaseData['weight_percentage'],
                    'start_date'        => $phaseData['start_date'],
                    'end_date'          => $phaseData['end_date'],
                    'created_by'        => $user->id,
                ]);

                foreach (($phaseData['milestones'] ?? []) as $msIndex => $msData) {
                    $phase->milestones()->create([
                        'project_id'      => $project->id,
                        'milestone_name'  => $msData['milestone_name'],
                        'start_date'      => $msData['start_date'],
                        'end_date'        => $msData['end_date'],
                        'has_quantity'    => $msData['has_quantity'] ?? false,
                        'target_quantity' => ($msData['has_quantity'] ?? false) ? ($msData['quantity_target'] ?? null) : null,
                        'sequence_no'     => $msIndex + 1,
                        'created_by'      => $user->id,
                    ]);
                }
            }

            $this->logActivity($project, $user, 'MILESTONE_PLAN_SAVED', 'Milestone plan saved as draft.');

            return $project->fresh(['phases.milestones']);
        });
    }

    /**
     * Finalize milestone plan — transitions status to PENDING_ACCOUNTING_APPROVAL.
     */
    public function submitMilestonePlan(Project $project, User $user): Project
    {
        return DB::transaction(function () use ($project, $user) {
            $oldStatus = $project->status->value;
            $oldSubStatus = $project->sub_status?->value;
            $isResubmission = $project->sub_status === ProjectSubStatus::FOR_REVISION;

            $project->update([
                'status'                 => ProjectStatus::PROPOSED->value,
                'sub_status'             => ProjectSubStatus::PENDING_APPROVAL->value,
                'rejected_by'            => null,
                'rejection_reason'       => null,
                'accounting_approved_by' => null,
                'accounting_approved_at' => null,
                'executive_approved_by'  => null,
                'executive_approved_at'  => null,
            ]);

            $action = $isResubmission ? 'MILESTONES_RESUBMITTED' : 'MILESTONES_SUBMITTED';
            $desc   = $isResubmission
                ? 'Milestone plan resubmitted after revision. Project pending accounting approval.'
                : 'Milestone plan submitted. Project pending accounting approval.';

            $this->logRevision($project, $user, $oldStatus . ($oldSubStatus ? ":{$oldSubStatus}" : ""), ProjectStatus::PROPOSED->value . ":" . ProjectSubStatus::PENDING_APPROVAL->value, $desc);
            $this->logActivity($project, $user, $action, $desc);

            return $project->fresh();
        });
    }

    /**
     * Process accounting approval or rejection.
     */
    public function processAccountingApproval(Project $project, string $decision, ?string $comments, User $user): Project
    {
        return DB::transaction(function () use ($project, $decision, $comments, $user) {
            $oldStatus = $project->status->value;

            // Record the approval decision
            ProjectApproval::create([
                'project_id'       => $project->id,
                'approval_stage'   => 'ACCOUNTING',
                'approver_user_id' => $user->id,
                'decision'         => $decision,
                'comments'         => $comments,
                'decided_at'       => now(),
            ]);

            if ($decision === 'APPROVED') {
                $project->update([
                    'status'                 => ProjectStatus::PROPOSED->value,
                    'sub_status'             => ProjectSubStatus::PENDING_APPROVAL->value,
                    'accounting_approved_by' => $user->id,
                    'accounting_approved_at' => now(),
                ]);
                $newStatus = ProjectStatus::PROPOSED->value . ":" . ProjectSubStatus::PENDING_APPROVAL->value;
                $this->logActivity($project, $user, 'ACCOUNTING_APPROVED', 'Accounting approved the project. Now pending executive approval.');
            } else {
                $project->update([
                    'status'           => ProjectStatus::PROPOSED->value,
                    'sub_status'       => ProjectSubStatus::FOR_REVISION->value,
                    'rejected_by'      => $user->id,
                    'rejection_reason' => $comments,
                ]);
                $newStatus = ProjectStatus::PROPOSED->value . ":" . ProjectSubStatus::FOR_REVISION->value;
                $this->logActivity($project, $user, 'ACCOUNTING_REJECTED', "Accounting rejected: {$comments}");
            }

            $currentFullStatus = $project->status->value . ($project->sub_status ? ":{$project->sub_status->value}" : "");
            $this->logRevision($project, $user, $oldStatus . ($project->getOriginal('sub_status') ? ":{$project->getOriginal('sub_status')}" : ""), $newStatus, $comments);

            return $project->fresh();
        });
    }

    /**
     * Process executive (CEO/COO) approval or rejection.
     */
    public function processExecutiveApproval(Project $project, string $decision, ?string $comments, User $user): Project
    {
        return DB::transaction(function () use ($project, $decision, $comments, $user) {
            $oldStatus = $project->status->value;

            ProjectApproval::create([
                'project_id'       => $project->id,
                'approval_stage'   => 'EXECUTIVE',
                'approver_user_id' => $user->id,
                'decision'         => $decision,
                'comments'         => $comments,
                'decided_at'       => now(),
            ]);

            if ($decision === 'APPROVED') {
                $project->update([
                    'status'                 => ProjectStatus::ONGOING->value,
                    'sub_status'             => null,
                    'executive_approved_by' => $user->id,
                    'executive_approved_at' => now(),
                ]);
                $newStatus = ProjectStatus::ONGOING->value;
                $this->logActivity($project, $user, 'EXECUTIVE_APPROVED', 'Executive approved the project. Project is now ongoing.');
            } else {
                $project->update([
                    'status'           => ProjectStatus::PROPOSED->value,
                    'sub_status'       => ProjectSubStatus::FOR_REVISION->value,
                    'rejected_by'      => $user->id,
                    'rejection_reason' => $comments,
                ]);
                $newStatus = ProjectStatus::PROPOSED->value . ":" . ProjectSubStatus::FOR_REVISION->value;
                $this->logActivity($project, $user, 'EXECUTIVE_REJECTED', "Executive rejected: {$comments}");
            }

            $currentFullFrom = $oldStatus . ($project->getOriginal('sub_status') ? ":{$project->getOriginal('sub_status')}" : "");
            $this->logRevision($project, $user, $currentFullFrom, $newStatus, $comments);

            return $project->fresh();
        });
    }

    // ── Private helpers ─────────────────────────────────────────────────

    private function logActivity(Project $project, User $user, string $action, ?string $description = null): void
    {
        ProjectActivityLog::create([
            'project_id'  => $project->id,
            'user_id'     => $user->id,
            'action'      => $action,
            'description' => $description,
            'created_at'  => now(),
        ]);
    }

    private function logRevision(Project $project, User $user, string $from, string $to, ?string $comments = null): void
    {
        ProjectRevision::create([
            'project_id'   => $project->id,
            'from_status'  => $from,
            'to_status'    => $to,
            'requested_by' => $user->id,
            'comments'     => $comments,
            'created_at'   => now(),
        ]);
    }
}
