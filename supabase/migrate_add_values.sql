-- Migration: Add card values and update inventory
-- Run this in Supabase SQL Editor

-- Step 1: Add card_value column
ALTER TABLE card_types ADD COLUMN card_value DECIMAL(10,2) NOT NULL DEFAULT 0;

-- Step 2: Update existing cards with values and fix names
UPDATE card_types SET name = 'MTS Day Pass', card_value = 7.00 WHERE name = 'Pronto';
UPDATE card_types SET card_value = 15.00 WHERE name = '7-Eleven';
UPDATE card_types SET card_value = 30.00 WHERE name = 'Grocery Outlet';
UPDATE card_types SET card_value = 25.00 WHERE name = 'Shell';
UPDATE card_types SET card_value = 15.00 WHERE name = 'Wendy''s';

-- Step 3: Drop and recreate the view with value columns
DROP VIEW IF EXISTS inventory_summary;

CREATE VIEW inventory_summary AS
SELECT
    ct.id,
    ct.name,
    ct.initial_count,
    ct.card_value,
    ct.initial_count * ct.card_value AS initial_value,
    COALESCE(SUM(d.quantity), 0)::INTEGER AS distributed,
    COALESCE(SUM(d.quantity), 0) * ct.card_value AS distributed_value,
    ct.initial_count - COALESCE(SUM(d.quantity), 0) AS remaining,
    (ct.initial_count - COALESCE(SUM(d.quantity), 0)) * ct.card_value AS remaining_value
FROM card_types ct
LEFT JOIN distributions d ON ct.id = d.card_type_id
GROUP BY ct.id, ct.name, ct.initial_count, ct.card_value;
