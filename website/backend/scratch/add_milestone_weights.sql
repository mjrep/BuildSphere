-- SQL Migration: Add weight_percentage to project_milestones
ALTER TABLE project_milestones ADD COLUMN weight_percentage NUMERIC DEFAULT 0;

-- Update existing records to have an even distribution if needed
-- This is a safety measure for existing data
WITH milestone_counts AS (
    SELECT project_phase_id, count(*) as count
    FROM project_milestones
    GROUP BY project_phase_id
)
UPDATE project_milestones pm
SET weight_percentage = 100.0 / mc.count
FROM milestone_counts mc
WHERE pm.project_phase_id = mc.project_phase_id;
