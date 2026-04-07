-- Migration 010: Customer saved addresses
-- Allows customers to save shipping addresses for reuse

CREATE TABLE IF NOT EXISTS customer_addresses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  label TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL,
  phone TEXT NOT NULL DEFAULT '',
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE customer_addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers can view own addresses"
  ON customer_addresses FOR SELECT
  USING (auth.uid() = customer_id);

CREATE POLICY "Customers can insert own addresses"
  ON customer_addresses FOR INSERT
  WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Customers can update own addresses"
  ON customer_addresses FOR UPDATE
  USING (auth.uid() = customer_id);

CREATE POLICY "Customers can delete own addresses"
  ON customer_addresses FOR DELETE
  USING (auth.uid() = customer_id);

-- When setting a new default, unset old defaults
CREATE OR REPLACE FUNCTION unset_other_default_addresses()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default = true THEN
    UPDATE customer_addresses
    SET is_default = false
    WHERE customer_id = NEW.customer_id AND id != NEW.id AND is_default = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_unset_default_address
  BEFORE INSERT OR UPDATE ON customer_addresses
  FOR EACH ROW
  EXECUTE FUNCTION unset_other_default_addresses();
