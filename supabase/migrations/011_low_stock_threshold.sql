-- Migration 011: Low stock threshold for stores
ALTER TABLE stores ADD COLUMN IF NOT EXISTS low_stock_threshold INTEGER NOT NULL DEFAULT 5;
