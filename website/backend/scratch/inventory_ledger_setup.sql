-- SQL Migration: Append-Only Inventory Ledger System (Corrected All ID Types)

-- 1. Create the inventory logs table with BIGINT types for all foreign keys
CREATE TABLE IF NOT EXISTS project_inventory_logs (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    item_id BIGINT NOT NULL REFERENCES project_inventory_items(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL CHECK (action_type IN ('RECEIVING', 'CONSUMPTION', 'SPOILAGE', 'ADJUSTMENT')),
    quantity NUMERIC NOT NULL CHECK (quantity > 0),
    current_stock NUMERIC, -- Added column for running balance
    reference_task_id BIGINT REFERENCES tasks(id) ON DELETE SET NULL,
    notes TEXT,
    created_by BIGINT REFERENCES users(id), -- Changed to BIGINT to match existing users schema
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure column exists if table was already created
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='project_inventory_logs' AND column_name='current_stock') THEN
        ALTER TABLE project_inventory_logs ADD COLUMN current_stock NUMERIC;
    END IF;
END $$;

-- 2. Create the trigger function to update current_stock in project_inventory_items
-- CHANGED: Now also populates NEW.current_stock for the ledger
CREATE OR REPLACE FUNCTION update_inventory_stock_on_log()
RETURNS TRIGGER AS $$
DECLARE
    v_new_stock NUMERIC;
BEGIN
    -- Get current stock with a lock to prevent race conditions
    SELECT current_stock INTO v_new_stock 
    FROM project_inventory_items 
    WHERE id = NEW.item_id 
    FOR UPDATE;

    -- Calculate the new stock based on the action
    IF NEW.action_type = 'RECEIVING' THEN
        v_new_stock := v_new_stock + NEW.quantity;
    ELSIF NEW.action_type = 'CONSUMPTION' OR NEW.action_type = 'SPOILAGE' THEN
        v_new_stock := v_new_stock - NEW.quantity;
    END IF;

    -- Update the item table
    UPDATE project_inventory_items
    SET current_stock = v_new_stock,
        updated_at = NOW()
    WHERE id = NEW.item_id;

    -- Record the resulting stock in the log entry itself
    NEW.current_stock := v_new_stock;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Attach the trigger to project_inventory_logs (Changed to BEFORE INSERT)
DROP TRIGGER IF EXISTS trg_update_inventory_stock ON project_inventory_logs;
CREATE TRIGGER trg_update_inventory_stock
BEFORE INSERT ON project_inventory_logs
FOR EACH ROW
EXECUTE FUNCTION update_inventory_stock_on_log();

-- 4. Add index for faster ledger lookups
CREATE INDEX IF NOT EXISTS idx_inventory_logs_item ON project_inventory_logs(item_id);
CREATE INDEX IF NOT EXISTS idx_inventory_logs_task ON project_inventory_logs(reference_task_id);

-- 5. Backfill existing records (Running total calculation)
WITH running_totals AS (
    SELECT 
        id,
        SUM(
            CASE 
                WHEN action_type IN ('RECEIVING', 'ADJUSTMENT') THEN quantity 
                ELSE -quantity 
            END
        ) OVER (PARTITION BY item_id ORDER BY created_at, id) as calculated_stock
    FROM project_inventory_logs
)
UPDATE project_inventory_logs
SET current_stock = running_totals.calculated_stock
FROM running_totals
WHERE project_inventory_logs.id = running_totals.id
AND project_inventory_logs.current_stock IS NULL;
