-- Add card_style column to store_settings
ALTER TABLE store_settings
  ADD COLUMN IF NOT EXISTS card_style TEXT NOT NULL DEFAULT 'standard';
