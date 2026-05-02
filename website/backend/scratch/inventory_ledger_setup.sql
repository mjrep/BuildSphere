-- SQL Migration: Append-Only Inventory Ledger System (Corrected All ID Types)

-- 1. Create the inventory logs table with BIGINT types for all foreign keys
CREATE TABLE IF NOT EXISTS project_inventory_logs (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    item_id BIGINT NOT NULL REFERENCES project_inventory_items(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL CHECK (action_type IN ('RECEIVING', 'CONSUMPTION', 'SPOILAGE', 'ADJUSTMENT')),
    quantity NUMERIC NOT NULL CHECK (quantity > 0),
    reference_task_id BIGINT REFERENCES tasks(id) ON DELETE SET NULL,
    notes TEXT,
    created_by BIGINT REFERENCES users(id), -- Changed to BIGINT to match existing users schema
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create the trigger function to update current_stock in project_inventory_items
CREATE OR REPLACE FUNCTION update_inventory_stock_on_log()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.action_type = 'RECEIVING' OR NEW.action_type = 'ADJUSTMENT' THEN
        UPDATE project_inventory_items
        SET current_stock = current_stock + NEW.quantity,
            updated_at = NOW()
        WHERE id = NEW.item_id;
    ELSIF NEW.action_type = 'CONSUMPTION' OR NEW.action_type = 'SPOILAGE' THEN
        UPDATE project_inventory_items
        SET current_stock = current_stock - NEW.quantity,
            updated_at = NOW()
        WHERE id = NEW.item_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Attach the trigger to project_inventory_logs
DROP TRIGGER IF EXISTS trg_update_inventory_stock ON project_inventory_logs;
CREATE TRIGGER trg_update_inventory_stock
AFTER INSERT ON project_inventory_logs
FOR EACH ROW
EXECUTE FUNCTION update_inventory_stock_on_log();

-- 4. Add index for faster ledger lookups
CREATE INDEX IF NOT EXISTS idx_inventory_logs_item ON project_inventory_logs(item_id);
CREATE INDEX IF NOT EXISTS idx_inventory_logs_task ON project_inventory_logs(reference_task_id);
