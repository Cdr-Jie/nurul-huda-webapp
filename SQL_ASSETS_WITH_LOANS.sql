-- ─── Updated Assets Management System ───────────────────────────────────────
-- This schema tracks individual asset instances and who has borrowed them

-- Create enum type for condition status
CREATE TYPE asset_condition AS ENUM ('excellent', 'good', 'fair', 'needs_repair');

-- Main assets table (asset types/templates)
CREATE TABLE IF NOT EXISTS assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  total_quantity INTEGER NOT NULL DEFAULT 1,
  default_condition asset_condition NOT NULL DEFAULT 'good',
  image_url TEXT,
  biro_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (biro_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Individual asset instances (each physical item)
CREATE TABLE IF NOT EXISTS asset_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL,
  instance_number INTEGER NOT NULL,
  condition asset_condition NOT NULL DEFAULT 'good',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE,
  UNIQUE(asset_id, instance_number)
);

-- Asset loans/borrowing records
CREATE TABLE IF NOT EXISTS asset_loans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_instance_id UUID NOT NULL,
  borrower_id UUID NOT NULL,
  borrow_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  expected_return_date TIMESTAMP WITH TIME ZONE,
  actual_return_date TIMESTAMP WITH TIME ZONE,
  borrower_name TEXT NOT NULL,
  borrower_email TEXT,
  purpose TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (asset_instance_id) REFERENCES asset_instances(id) ON DELETE CASCADE,
  FOREIGN KEY (borrower_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX idx_assets_category ON assets(category);
CREATE INDEX idx_assets_biro_id ON assets(biro_id);
CREATE INDEX idx_asset_instances_asset_id ON asset_instances(asset_id);
CREATE INDEX idx_asset_loans_asset_instance_id ON asset_loans(asset_instance_id);
CREATE INDEX idx_asset_loans_borrower_id ON asset_loans(borrower_id);
CREATE INDEX idx_asset_loans_actual_return_null ON asset_loans(actual_return_date) WHERE actual_return_date IS NULL;

-- Enable RLS (Row Level Security)
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_loans ENABLE ROW LEVEL SECURITY;

-- Policies for assets table
CREATE POLICY "Admins can view assets"
  ON assets
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND (
      (SELECT role FROM users WHERE id = auth.uid()) = 'superadmin'
      OR (
        (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
        AND (biro_id = (SELECT biro_id FROM users WHERE id = auth.uid()) OR biro_id IS NULL)
      )
    )
  );

CREATE POLICY "Admins can insert assets"
  ON assets
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND (SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'superadmin')
  );

CREATE POLICY "Admins can update assets"
  ON assets
  FOR UPDATE
  USING (
    auth.uid() IS NOT NULL
    AND (
      (SELECT role FROM users WHERE id = auth.uid()) = 'superadmin'
      OR (
        (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
        AND (biro_id = (SELECT biro_id FROM users WHERE id = auth.uid()) OR biro_id IS NULL)
      )
    )
  );

CREATE POLICY "Admins can delete assets"
  ON assets
  FOR DELETE
  USING (
    auth.uid() IS NOT NULL
    AND (
      (SELECT role FROM users WHERE id = auth.uid()) = 'superadmin'
      OR (
        (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
        AND (biro_id = (SELECT biro_id FROM users WHERE id = auth.uid()) OR biro_id IS NULL)
      )
    )
  );

-- Policies for asset_instances
CREATE POLICY "Admins can view asset instances"
  ON asset_instances
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM assets a
      WHERE a.id = asset_id
      AND (
        (SELECT role FROM users WHERE id = auth.uid()) = 'superadmin'
        OR (
          (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
          AND (a.biro_id = (SELECT biro_id FROM users WHERE id = auth.uid()) OR a.biro_id IS NULL)
        )
      )
    )
  );

CREATE POLICY "Admins can manage asset instances"
  ON asset_instances
  FOR ALL
  USING (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM assets a
      WHERE a.id = asset_id
      AND (
        (SELECT role FROM users WHERE id = auth.uid()) = 'superadmin'
        OR (
          (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
          AND (a.biro_id = (SELECT biro_id FROM users WHERE id = auth.uid()) OR a.biro_id IS NULL)
        )
      )
    )
  );

-- Policies for asset_loans
CREATE POLICY "Admins can view asset loans"
  ON asset_loans
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM asset_instances ai
      JOIN assets a ON a.id = ai.asset_id
      WHERE ai.id = asset_instance_id
      AND (
        (SELECT role FROM users WHERE id = auth.uid()) = 'superadmin'
        OR (
          (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
          AND (a.biro_id = (SELECT biro_id FROM users WHERE id = auth.uid()) OR a.biro_id IS NULL)
        )
      )
    )
  );

CREATE POLICY "Admins can manage asset loans"
  ON asset_loans
  FOR ALL
  USING (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM asset_instances ai
      JOIN assets a ON a.id = ai.asset_id
      WHERE ai.id = asset_instance_id
      AND (
        (SELECT role FROM users WHERE id = auth.uid()) = 'superadmin'
        OR (
          (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
          AND (a.biro_id = (SELECT biro_id FROM users WHERE id = auth.uid()) OR a.biro_id IS NULL)
        )
      )
    )
  );

-- ─── Helper Functions ───────────────────────────────────────────────────────

-- Function to get current borrower of an asset instance
CREATE OR REPLACE FUNCTION get_current_borrower(asset_instance_id UUID)
RETURNS TABLE(borrower_id UUID, borrower_name TEXT, borrower_email TEXT, borrow_date TIMESTAMP WITH TIME ZONE) AS $$
  SELECT 
    al.borrower_id,
    al.borrower_name,
    al.borrower_email,
    al.borrow_date
  FROM asset_loans al
  WHERE al.asset_instance_id = $1
    AND al.actual_return_date IS NULL
  ORDER BY al.borrow_date DESC
  LIMIT 1;
$$ LANGUAGE SQL STABLE;

-- Function to get available count for an asset
CREATE OR REPLACE FUNCTION get_available_count(asset_id UUID)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER
  FROM asset_instances ai
  WHERE ai.asset_id = $1
    AND NOT EXISTS (
      SELECT 1 FROM asset_loans al
      WHERE al.asset_instance_id = ai.id
        AND al.actual_return_date IS NULL
    );
$$ LANGUAGE SQL STABLE;

-- ─── Sample Data (Optional) ───────────────────────────────────────────────────
-- Uncomment to add sample assets:
/*
-- Insert asset type
INSERT INTO assets (name, category, description, total_quantity, default_condition, image_url) 
VALUES 
  ('Kerusi Lipat', 'Furniture', 'Kerusi plastik lipat berwarna putih', 20, 'good', NULL),
  ('Projector', 'Electronics', 'Projector Sony dengan remote', 2, 'excellent', NULL);

-- Create instances for Kerusi Lipat (20 instances)
WITH numbered_instances AS (
  SELECT generate_series(1, 20) AS instance_number
)
INSERT INTO asset_instances (asset_id, instance_number, condition)
SELECT (SELECT id FROM assets WHERE name = 'Kerusi Lipat'), instance_number, 'good'
FROM numbered_instances;

-- Create instances for Projector (2 instances)
WITH numbered_instances AS (
  SELECT generate_series(1, 2) AS instance_number
)
INSERT INTO asset_instances (asset_id, instance_number, condition)
SELECT (SELECT id FROM assets WHERE name = 'Projector'), instance_number, 'excellent'
FROM numbered_instances;

-- Add sample loan records
INSERT INTO asset_loans (asset_instance_id, borrower_id, borrower_name, borrower_email, borrow_date, expected_return_date, purpose)
SELECT 
  ai.id,
  (SELECT id FROM users LIMIT 1),
  'Nama Peminjam',
  'peminjam@email.com',
  NOW() - INTERVAL '2 days',
  NOW() + INTERVAL '5 days',
  'Acara khidmat'
FROM asset_instances ai
WHERE ai.asset_id = (SELECT id FROM assets WHERE name = 'Kerusi Lipat')
LIMIT 5;
*/
