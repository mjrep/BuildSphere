-- 1. Add progress_percentage to projects
ALTER TABLE projects ADD COLUMN IF NOT EXISTS progress_percentage NUMERIC DEFAULT 0;

-- 2. Create the calculation function
CREATE OR REPLACE FUNCTION recalculate_project_progress(target_project_id BIGINT)
RETURNS VOID AS $$
DECLARE
    total_project_weight NUMERIC := 0;
    project_progress NUMERIC := 0;
    phase_record RECORD;
    milestone_record RECORD;
    task_count INT;
    completed_task_count INT;
    t_pct NUMERIC;
    q_pct NUMERIC;
    ms_progress NUMERIC;
    phase_weighted_progress NUMERIC;
    total_phase_weight NUMERIC;
    ms_count INT;
    phase_count INT;
BEGIN
    project_progress := 0;
    
    -- Calculate total project weight and phase count
    SELECT COALESCE(SUM(weight_percentage), 0), COUNT(id)
    INTO total_project_weight, phase_count
    FROM project_phases
    WHERE project_id = target_project_id;

    FOR phase_record IN SELECT * FROM project_phases WHERE project_id = target_project_id LOOP
        phase_weighted_progress := 0;
        
        -- Calculate total phase weight and milestone count
        SELECT COALESCE(SUM(weight_percentage), 0), COUNT(id)
        INTO total_phase_weight, ms_count
        FROM project_milestones
        WHERE project_phase_id = phase_record.id;

        FOR milestone_record IN SELECT * FROM project_milestones WHERE project_phase_id = phase_record.id LOOP
            -- Task Percentage
            SELECT COUNT(*), COUNT(*) FILTER (WHERE status = 'completed')
            INTO task_count, completed_task_count
            FROM tasks
            WHERE milestone_id = milestone_record.id;

            t_pct := NULL;
            IF task_count > 0 THEN
                t_pct := (completed_task_count::NUMERIC / task_count::NUMERIC) * 100;
            END IF;

            -- Quantity Percentage
            q_pct := NULL;
            IF milestone_record.has_quantity AND milestone_record.target_quantity > 0 THEN
                q_pct := (milestone_record.current_quantity::NUMERIC / milestone_record.target_quantity::NUMERIC) * 100;
            END IF;

            -- Combine
            ms_progress := 0;
            IF q_pct IS NOT NULL AND t_pct IS NOT NULL THEN
                ms_progress := ROUND((q_pct + t_pct) / 2);
            ELSIF q_pct IS NOT NULL THEN
                ms_progress := ROUND(q_pct);
            ELSIF t_pct IS NOT NULL THEN
                ms_progress := ROUND(t_pct);
            END IF;

            ms_progress := LEAST(100, ms_progress);

            -- Add to phase
            IF total_phase_weight > 0 THEN
                phase_weighted_progress := phase_weighted_progress + (ms_progress * (COALESCE(milestone_record.weight_percentage, 0) / total_phase_weight));
            ELSIF ms_count > 0 THEN
                phase_weighted_progress := phase_weighted_progress + (ms_progress * (1.0 / ms_count));
            END IF;
        END LOOP;

        phase_weighted_progress := ROUND(phase_weighted_progress);

        -- Add to project
        IF total_project_weight > 0 THEN
            project_progress := project_progress + (phase_weighted_progress * (COALESCE(phase_record.weight_percentage, 0) / total_project_weight));
        ELSIF phase_count > 0 THEN
            project_progress := project_progress + (phase_weighted_progress * (1.0 / phase_count));
        END IF;

    END LOOP;

    project_progress := ROUND(project_progress);

    -- Update the projects table
    UPDATE projects
    SET progress_percentage = project_progress
    WHERE id = target_project_id;
    
END;
$$ LANGUAGE plpgsql;

-- 3. Create the trigger handler function
CREATE OR REPLACE FUNCTION trigger_recalculate_project_progress()
RETURNS TRIGGER AS $$
DECLARE
    target_id BIGINT;
BEGIN
    IF TG_OP = 'DELETE' THEN
        target_id := OLD.project_id;
    ELSE
        target_id := NEW.project_id;
    END IF;

    IF target_id IS NOT NULL THEN
        PERFORM recalculate_project_progress(target_id);
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 4. Apply triggers to tasks, project_milestones, project_phases
DROP TRIGGER IF EXISTS trigger_tasks_progress ON tasks;
CREATE TRIGGER trigger_tasks_progress
AFTER INSERT OR UPDATE OF status, milestone_id OR DELETE ON tasks
FOR EACH ROW EXECUTE FUNCTION trigger_recalculate_project_progress();

DROP TRIGGER IF EXISTS trigger_milestones_progress ON project_milestones;
CREATE TRIGGER trigger_milestones_progress
AFTER INSERT OR UPDATE OF current_quantity, target_quantity, has_quantity, weight_percentage OR DELETE ON project_milestones
FOR EACH ROW EXECUTE FUNCTION trigger_recalculate_project_progress();

DROP TRIGGER IF EXISTS trigger_phases_progress ON project_phases;
CREATE TRIGGER trigger_phases_progress
AFTER INSERT OR UPDATE OF weight_percentage OR DELETE ON project_phases
FOR EACH ROW EXECUTE FUNCTION trigger_recalculate_project_progress();

-- 5. Backfill existing projects (Optional, to set initial values)
DO $$
DECLARE
    p_id BIGINT;
BEGIN
    FOR p_id IN SELECT id FROM projects LOOP
        PERFORM recalculate_project_progress(p_id);
    END LOOP;
END;
$$;
