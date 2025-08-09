-- San Diego Electric Bike Test Ride Database Schema
-- Based on Base44 entities converted to proper PostgreSQL schema

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Customers table
CREATE TABLE customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(255),
  id_photo_url TEXT,
  signature_data TEXT,
  waiver_url TEXT,
  waiver_signed BOOLEAN DEFAULT FALSE,
  -- Submission metadata
  submission_ip TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Test drives table
CREATE TABLE test_drives (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  bike_model VARCHAR(100) NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE,
  end_time TIMESTAMP WITH TIME ZONE,
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SMS notifications table
CREATE TABLE notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  test_drive_id UUID REFERENCES test_drives(id) ON DELETE CASCADE,
  customer_phone VARCHAR(20) NOT NULL,
  message_content TEXT NOT NULL,
  message_type VARCHAR(50) NOT NULL CHECK (message_type IN ('confirmation', 'reminder', 'completion', 'overdue')),
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  delivery_status VARCHAR(50) DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'sent', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Staff users table (for admin dashboard)
CREATE TABLE staff_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'staff' CHECK (role IN ('admin', 'staff')),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bike inventory table (for future expansion)
CREATE TABLE bike_inventory (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  model VARCHAR(100) NOT NULL,
  brand VARCHAR(100) NOT NULL,
  description TEXT,
  image_url TEXT,
  is_available BOOLEAN DEFAULT TRUE,
  maintenance_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default bike models
INSERT INTO bike_inventory (model, brand, description, is_available) VALUES
('Pace 500.3', 'Aventon', 'A comfortable, upright cruiser with impressive power.', TRUE),
('Turbo Vado 4.0', 'Specialized', 'A premium, smooth-riding commuter for any terrain.', TRUE),
('Ultimate C380', 'Gazelle', 'Top-tier Dutch comfort and seamless shifting.', TRUE),
('Adventure Neo', 'Cannondale', 'An accessible, all-road e-bike ready for adventure.', TRUE);

-- Create indexes for performance
CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_test_drives_customer_id ON test_drives(customer_id);
CREATE INDEX idx_test_drives_status ON test_drives(status);
CREATE INDEX idx_test_drives_start_time ON test_drives(start_time);
CREATE INDEX idx_test_drives_bike_model ON test_drives(bike_model);
CREATE INDEX idx_notifications_customer_id ON notifications(customer_id);
CREATE INDEX idx_notifications_test_drive_id ON notifications(test_drive_id);
CREATE INDEX idx_notifications_sent_at ON notifications(sent_at);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_test_drives_updated_at BEFORE UPDATE ON test_drives
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_staff_users_updated_at BEFORE UPDATE ON staff_users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bike_inventory_updated_at BEFORE UPDATE ON bike_inventory
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_drives ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE bike_inventory ENABLE ROW LEVEL SECURITY;

-- Allow public read access to bike inventory (for customer widget)
CREATE POLICY "Bike inventory is publicly readable" ON bike_inventory
    FOR SELECT USING (TRUE);

-- Staff users can do everything (for admin dashboard)
CREATE POLICY "Staff can manage all data" ON customers
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Staff can manage test drives" ON test_drives
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Staff can manage notifications" ON notifications
    FOR ALL USING (auth.role() = 'authenticated');

-- Public can create customers and test drives (for customer widget)
CREATE POLICY "Anyone can create customers" ON customers
    FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "Anyone can create test drives" ON test_drives
    FOR INSERT WITH CHECK (TRUE);

-- Create views for common queries
CREATE VIEW active_test_drives AS
SELECT 
    td.*,
    c.name as customer_name,
    c.phone as customer_phone,
    c.email as customer_email
FROM test_drives td
JOIN customers c ON td.customer_id = c.id
WHERE td.status = 'active';

CREATE VIEW overdue_test_drives AS
SELECT 
    td.*,
    c.name as customer_name,
    c.phone as customer_phone,
    c.email as customer_email
FROM test_drives td
JOIN customers c ON td.customer_id = c.id
WHERE td.status = 'active' 
AND td.end_time < NOW();

-- Create function to automatically set end_time when creating test drive
CREATE OR REPLACE FUNCTION set_test_drive_end_time()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.end_time IS NULL AND NEW.start_time IS NOT NULL THEN
        NEW.end_time = NEW.start_time + INTERVAL '30 minutes';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_set_end_time BEFORE INSERT ON test_drives
    FOR EACH ROW EXECUTE FUNCTION set_test_drive_end_time();

-- Sample data for development (remove for production)
-- INSERT INTO staff_users (email, full_name, role) VALUES
-- ('admin@sdebike.com', 'SDEBIKE Admin', 'admin');