/*
  # Add Admin System

  1. New Tables
    - `admin_users` - Admin user accounts with roles
    - `system_settings` - Global system configuration
    - `audit_logs` - Track all system activities

  2. Security
    - Enable RLS on all new tables
    - Add admin-specific policies
    - Create admin role management

  3. Features
    - Multi-level admin roles (super_admin, admin, moderator)
    - System-wide analytics and reporting
    - User management capabilities
    - Audit trail for all actions
*/

-- Create admin_users table
CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  role text DEFAULT 'admin' CHECK (role IN ('super_admin', 'admin', 'moderator')),
  is_active boolean DEFAULT true,
  last_login timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create system_settings table
CREATE TABLE IF NOT EXISTS system_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL,
  description text,
  updated_by uuid REFERENCES admin_users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  admin_id uuid REFERENCES admin_users(id),
  action text NOT NULL,
  table_name text,
  record_id uuid,
  old_values jsonb,
  new_values jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Add is_admin column to users table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'is_admin'
  ) THEN
    ALTER TABLE users ADD COLUMN is_admin boolean DEFAULT false;
  END IF;
END $$;

-- Create admin policies
CREATE POLICY "Admins can read all admin users"
  ON admin_users
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.is_admin = true
    )
  );

CREATE POLICY "Super admins can manage admin users"
  ON admin_users
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.id = auth.uid() 
      AND admin_users.role = 'super_admin'
    )
  );

CREATE POLICY "Admins can read system settings"
  ON system_settings
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.is_admin = true
    )
  );

CREATE POLICY "Admins can manage system settings"
  ON system_settings
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.id = auth.uid() 
      AND admin_users.role IN ('super_admin', 'admin')
    )
  );

CREATE POLICY "Admins can read audit logs"
  ON audit_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.is_admin = true
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON admin_users(role);
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(key);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_admin_id ON audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_users_is_admin ON users(is_admin);

-- Create triggers for updated_at
CREATE TRIGGER update_admin_users_updated_at
  BEFORE UPDATE ON admin_users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_settings_updated_at
  BEFORE UPDATE ON system_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default admin user (password should be set via Supabase Auth)
INSERT INTO admin_users (id, email, name, role) 
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'admin@invoicepro.com',
  'System Administrator',
  'super_admin'
) ON CONFLICT (email) DO NOTHING;

-- Insert default system settings
INSERT INTO system_settings (key, value, description) VALUES
  ('app_name', '"InvoicePro"', 'Application name'),
  ('app_version', '"1.0.0"', 'Application version'),
  ('maintenance_mode', 'false', 'Enable/disable maintenance mode'),
  ('max_users', '1000', 'Maximum number of users allowed'),
  ('default_currency', '"USD"', 'Default currency for new invoices'),
  ('tax_rates', '{"default": 10, "reduced": 5, "zero": 0}', 'Available tax rates'),
  ('email_settings', '{"smtp_host": "", "smtp_port": 587, "smtp_user": "", "smtp_pass": ""}', 'Email configuration')
ON CONFLICT (key) DO NOTHING;

-- Create function to log admin actions
CREATE OR REPLACE FUNCTION log_admin_action(
  p_action text,
  p_table_name text DEFAULT NULL,
  p_record_id uuid DEFAULT NULL,
  p_old_values jsonb DEFAULT NULL,
  p_new_values jsonb DEFAULT NULL
) RETURNS void AS $$
BEGIN
  INSERT INTO audit_logs (
    admin_id,
    action,
    table_name,
    record_id,
    old_values,
    new_values
  ) VALUES (
    auth.uid(),
    p_action,
    p_table_name,
    p_record_id,
    p_old_values,
    p_new_values
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create view for admin dashboard stats
CREATE OR REPLACE VIEW admin_dashboard_stats AS
SELECT 
  (SELECT COUNT(*) FROM users WHERE is_admin = false) as total_users,
  (SELECT COUNT(*) FROM users WHERE is_admin = false AND created_at >= CURRENT_DATE - INTERVAL '30 days') as new_users_this_month,
  (SELECT COUNT(*) FROM invoices) as total_invoices,
  (SELECT COUNT(*) FROM invoices WHERE status = 'paid') as paid_invoices,
  (SELECT COUNT(*) FROM invoices WHERE status = 'overdue') as overdue_invoices,
  (SELECT COALESCE(SUM(total), 0) FROM invoices WHERE status = 'paid') as total_revenue,
  (SELECT COALESCE(SUM(total), 0) FROM invoices WHERE status = 'paid' AND created_at >= CURRENT_DATE - INTERVAL '30 days') as revenue_this_month,
  (SELECT COUNT(*) FROM clients) as total_clients;

-- Grant access to admin view
GRANT SELECT ON admin_dashboard_stats TO authenticated;