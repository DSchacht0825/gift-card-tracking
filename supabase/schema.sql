-- Gift Card Tracking System - Supabase Schema
-- Run this in your Supabase SQL Editor

-- Create card_types table
CREATE TABLE card_types (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    initial_count INTEGER NOT NULL DEFAULT 0,
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

-- Insert initial inventory
INSERT INTO card_types (name, initial_count) VALUES
    ('Pronto', 100),
    ('7-Eleven', 7),
    ('Grocery Outlet', 15),
    ('Wendy''s', 40);

-- Create a view for inventory summary
CREATE VIEW inventory_summary AS
SELECT
    ct.id,
    ct.name,
    ct.initial_count,
    COALESCE(SUM(d.quantity), 0) AS distributed,
    ct.initial_count - COALESCE(SUM(d.quantity), 0) AS remaining
FROM card_types ct
LEFT JOIN distributions d ON ct.id = d.card_type_id
GROUP BY ct.id, ct.name, ct.initial_count;

-- Enable Row Level Security (optional but recommended)
ALTER TABLE card_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE distributions ENABLE ROW LEVEL SECURITY;

-- Create policies to allow all operations (since no auth)
CREATE POLICY "Allow all operations on card_types" ON card_types
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on distributions" ON distributions
    FOR ALL USING (true) WITH CHECK (true);
