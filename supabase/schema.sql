-- Gift Card Tracking System - Supabase Schema
-- Run this in your Supabase SQL Editor

-- Create card_types table
CREATE TABLE card_types (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    initial_count INTEGER NOT NULL DEFAULT 0,
    card_value DECIMAL(10,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create distributions table
CREATE TABLE distributions (
    id SERIAL PRIMARY KEY,
    recipient_name TEXT NOT NULL,
    recipient_uid TEXT NOT NULL,
    card_type_id INTEGER NOT NULL REFERENCES card_types(id),
    quantity INTEGER NOT NULL DEFAULT 1,
    distributed_at DATE NOT NULL DEFAULT CURRENT_DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_distributions_card_type ON distributions(card_type_id);
CREATE INDEX idx_distributions_date ON distributions(distributed_at);

-- Insert initial inventory with values
INSERT INTO card_types (name, initial_count, card_value) VALUES
    ('MTS Day Pass', 100, 7.00),
    ('7-Eleven', 7, 15.00),
    ('Grocery Outlet', 15, 30.00),
    ('Shell', 21, 25.00),
    ('Wendy''s', 40, 15.00);

-- Create a view for inventory summary with dollar values
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

-- Enable Row Level Security (optional but recommended)
ALTER TABLE card_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE distributions ENABLE ROW LEVEL SECURITY;

-- Create policies to allow all operations (since no auth)
CREATE POLICY "Allow all operations on card_types" ON card_types
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on distributions" ON distributions
    FOR ALL USING (true) WITH CHECK (true);
