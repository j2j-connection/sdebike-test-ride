-- Multi-Tenant Schema Update for SD Electric Bike Test Ride Platform
-- Transforms single-shop app into multi-shop SaaS platform

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Shops table - Core multi-tenant entity
CREATE TABLE shops (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug VARCHAR(50) UNIQUE NOT NULL, -- URL-friendly shop identifier (e.g. 'sd-electric-bike')
  name VARCHAR(255) NOT NULL, -- Display name (e.g. 'San Diego Electric Bike')
  business_name VARCHAR(255), -- Legal business name
  description TEXT,
  
  -- Contact & Location
  email VARCHAR(255),
  phone VARCHAR(20),
  address JSONB, -- {street, city, state, zip, country}
  website_url TEXT,
  
  -- Branding & Customization
  logo_url TEXT,
  primary_color VARCHAR(7) DEFAULT '#3B82F6', -- Hex color code
  secondary_color VARCHAR(7) DEFAULT '#1E40AF',
  custom_css TEXT,
  
  -- Business Settings
  default_test_duration_minutes INTEGER DEFAULT 30,
  authorization_amount_cents INTEGER DEFAULT 100, -- $1.00 default
  require_id_photo BOOLEAN DEFAULT TRUE,
  require_waiver BOOLEAN DEFAULT TRUE,
  
  -- Payment & Integration
  stripe_account_id VARCHAR(255), -- For Stripe Connect (future)
  textbelt_api_key VARCHAR(255),
  twilio_account_sid VARCHAR(255),
  twilio_auth_token VARCHAR(255),
  
  -- Subscription & Status
  subscription_tier VARCHAR(50) DEFAULT 'basic' CHECK (subscription_tier IN ('basic', 'pro', 'enterprise')),
  subscription_status VARCHAR(50) DEFAULT 'active' CHECK (subscription_status IN ('trial', 'active', 'suspended', 'cancelled')),
  trial_ends_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  is_active BOOLEAN DEFAULT TRUE,
  onboarded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Shop admins table - Per-shop user management
CREATE TABLE shop_admins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'staff' CHECK (role IN ('owner', 'admin', 'staff')),
  permissions JSONB DEFAULT '{}', -- Flexible permission system
  is_active BOOLEAN DEFAULT TRUE,
  invited_at TIMESTAMP WITH TIME ZONE,
  last_login_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure unique email per shop
  UNIQUE(shop_id, email)
);

-- Updated customers table with shop context
CREATE TABLE customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE, -- Multi-tenant key
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

-- Updated test drives table with shop context
CREATE TABLE test_drives (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE, -- Multi-tenant key
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  bike_model VARCHAR(100) NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE,
  end_time TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER,
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  notes TEXT,
  
  -- Payment information
  stripe_payment_intent_id VARCHAR(255),
  authorization_amount_cents INTEGER,
  payment_status VARCHAR(50) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'authorized', 'captured', 'failed', 'cancelled')),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Updated notifications table with shop context
CREATE TABLE notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE, -- Multi-tenant key
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  test_drive_id UUID REFERENCES test_drives(id) ON DELETE CASCADE,
  customer_phone VARCHAR(20) NOT NULL,
  message_content TEXT NOT NULL,
  message_type VARCHAR(50) NOT NULL CHECK (message_type IN ('confirmation', 'reminder', 'completion', 'overdue')),
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  delivery_status VARCHAR(50) DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'sent', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Updated bike inventory table with shop context
CREATE TABLE bike_inventory (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE, -- Multi-tenant key
  model VARCHAR(100) NOT NULL,
  brand VARCHAR(100) NOT NULL,
  description TEXT,
  image_url TEXT,
  is_available BOOLEAN DEFAULT TRUE,
  maintenance_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Platform-level staff users (super admins)
CREATE TABLE platform_admins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'admin' CHECK (role IN ('super_admin', 'admin', 'support')),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_shops_slug ON shops(slug);
CREATE INDEX idx_shops_subscription_status ON shops(subscription_status);
CREATE INDEX idx_shop_admins_shop_id ON shop_admins(shop_id);
CREATE INDEX idx_shop_admins_email ON shop_admins(email);
CREATE INDEX idx_customers_shop_id ON customers(shop_id);
CREATE INDEX idx_customers_phone_shop ON customers(shop_id, phone);
CREATE INDEX idx_customers_email_shop ON customers(shop_id, email);
CREATE INDEX idx_test_drives_shop_id ON test_drives(shop_id);
CREATE INDEX idx_test_drives_customer_id ON test_drives(customer_id);
CREATE INDEX idx_test_drives_status_shop ON test_drives(shop_id, status);
CREATE INDEX idx_test_drives_start_time ON test_drives(start_time);
CREATE INDEX idx_test_drives_bike_model_shop ON test_drives(shop_id, bike_model);
CREATE INDEX idx_notifications_shop_id ON notifications(shop_id);
CREATE INDEX idx_notifications_customer_id ON notifications(customer_id);
CREATE INDEX idx_notifications_test_drive_id ON notifications(test_drive_id);
CREATE INDEX idx_bike_inventory_shop_id ON bike_inventory(shop_id);
CREATE INDEX idx_bike_inventory_available_shop ON bike_inventory(shop_id, is_available);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_shops_updated_at BEFORE UPDATE ON shops
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shop_admins_updated_at BEFORE UPDATE ON shop_admins
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_test_drives_updated_at BEFORE UPDATE ON test_drives
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bike_inventory_updated_at BEFORE UPDATE ON bike_inventory
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_platform_admins_updated_at BEFORE UPDATE ON platform_admins
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies with shop isolation
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_drives ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE bike_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_admins ENABLE ROW LEVEL SECURITY;

-- Shop-specific RLS policies
-- Note: These policies assume shop_id is available in JWT or session context

-- Shop admins can access their shop's data
CREATE POLICY "Shop admins can access their shop" ON shops
    FOR ALL TO authenticated
    USING (
        id IN (
            SELECT shop_id FROM shop_admins 
            WHERE email = auth.jwt()->>'email' AND is_active = TRUE
        )
    );

-- Shop admins can manage their shop's admin users
CREATE POLICY "Shop admins can manage shop users" ON shop_admins
    FOR ALL TO authenticated
    USING (
        shop_id IN (
            SELECT shop_id FROM shop_admins 
            WHERE email = auth.jwt()->>'email' AND is_active = TRUE
        )
    );

-- Shop isolation for customers
CREATE POLICY "Shop admins can access shop customers" ON customers
    FOR ALL TO authenticated
    USING (
        shop_id IN (
            SELECT shop_id FROM shop_admins 
            WHERE email = auth.jwt()->>'email' AND is_active = TRUE
        )
    );

-- Public can create customers (with shop context)
CREATE POLICY "Anyone can create customers" ON customers
    FOR INSERT 
    WITH CHECK (shop_id IS NOT NULL);

-- Shop isolation for test drives
CREATE POLICY "Shop admins can access shop test drives" ON test_drives
    FOR ALL TO authenticated
    USING (
        shop_id IN (
            SELECT shop_id FROM shop_admins 
            WHERE email = auth.jwt()->>'email' AND is_active = TRUE
        )
    );

-- Public can create test drives (with shop context)
CREATE POLICY "Anyone can create test drives" ON test_drives
    FOR INSERT 
    WITH CHECK (shop_id IS NOT NULL);

-- Shop isolation for notifications
CREATE POLICY "Shop admins can access shop notifications" ON notifications
    FOR ALL TO authenticated
    USING (
        shop_id IN (
            SELECT shop_id FROM shop_admins 
            WHERE email = auth.jwt()->>'email' AND is_active = TRUE
        )
    );

-- Shop isolation for bike inventory
CREATE POLICY "Shop admins can manage shop inventory" ON bike_inventory
    FOR ALL TO authenticated
    USING (
        shop_id IN (
            SELECT shop_id FROM shop_admins 
            WHERE email = auth.jwt()->>'email' AND is_active = TRUE
        )
    );

-- Public can read bike inventory (for customer widget)
CREATE POLICY "Public can read bike inventory" ON bike_inventory
    FOR SELECT
    USING (is_available = TRUE);

-- Platform admin policies
CREATE POLICY "Platform admins can access everything" ON shops
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM platform_admins 
            WHERE email = auth.jwt()->>'email' AND is_active = TRUE
        )
    );

-- Create views for common multi-tenant queries
CREATE VIEW shop_active_test_drives AS
SELECT 
    td.*,
    c.name as customer_name,
    c.phone as customer_phone,
    c.email as customer_email,
    s.name as shop_name,
    s.slug as shop_slug
FROM test_drives td
JOIN customers c ON td.customer_id = c.id
JOIN shops s ON td.shop_id = s.id
WHERE td.status = 'active';

CREATE VIEW shop_overdue_test_drives AS
SELECT 
    td.*,
    c.name as customer_name,
    c.phone as customer_phone,
    c.email as customer_email,
    s.name as shop_name,
    s.slug as shop_slug
FROM test_drives td
JOIN customers c ON td.customer_id = c.id
JOIN shops s ON td.shop_id = s.id
WHERE td.status = 'active' 
AND td.end_time < NOW();

-- Functions to ensure data consistency
CREATE OR REPLACE FUNCTION ensure_shop_context()
RETURNS TRIGGER AS $$
BEGIN
    -- Ensure customer belongs to same shop as test drive
    IF TG_TABLE_NAME = 'test_drives' THEN
        IF NOT EXISTS (
            SELECT 1 FROM customers 
            WHERE id = NEW.customer_id 
            AND shop_id = NEW.shop_id
        ) THEN
            RAISE EXCEPTION 'Customer must belong to the same shop as test drive';
        END IF;
    END IF;
    
    -- Ensure notification belongs to same shop as customer/test drive
    IF TG_TABLE_NAME = 'notifications' THEN
        IF NOT EXISTS (
            SELECT 1 FROM customers c
            JOIN test_drives td ON c.id = td.customer_id
            WHERE c.id = NEW.customer_id 
            AND td.id = NEW.test_drive_id
            AND c.shop_id = NEW.shop_id
            AND td.shop_id = NEW.shop_id
        ) THEN
            RAISE EXCEPTION 'Notification must belong to the same shop as customer and test drive';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply shop context validation triggers
CREATE TRIGGER ensure_test_drive_shop_context 
    BEFORE INSERT OR UPDATE ON test_drives
    FOR EACH ROW EXECUTE FUNCTION ensure_shop_context();

CREATE TRIGGER ensure_notification_shop_context 
    BEFORE INSERT OR UPDATE ON notifications
    FOR EACH ROW EXECUTE FUNCTION ensure_shop_context();

-- Function to automatically set test drive end time based on shop settings
CREATE OR REPLACE FUNCTION set_test_drive_end_time_with_shop_settings()
RETURNS TRIGGER AS $$
DECLARE
    shop_duration INTEGER;
BEGIN
    IF NEW.end_time IS NULL AND NEW.start_time IS NOT NULL THEN
        -- Get shop's default test duration
        SELECT default_test_duration_minutes INTO shop_duration
        FROM shops WHERE id = NEW.shop_id;
        
        -- Use shop setting or fallback to 30 minutes
        NEW.duration_minutes = COALESCE(shop_duration, 30);
        NEW.end_time = NEW.start_time + (NEW.duration_minutes || ' minutes')::INTERVAL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_set_end_time_with_shop_settings 
    BEFORE INSERT ON test_drives
    FOR EACH ROW EXECUTE FUNCTION set_test_drive_end_time_with_shop_settings();

-- Insert the original SD Electric Bike as first shop
INSERT INTO shops (
    slug, name, business_name, description,
    email, phone,
    primary_color, secondary_color,
    is_active, onboarded_at
) VALUES (
    'sd-electric-bike', 
    'San Diego Electric Bike',
    'SD Electric Bike',
    'Premium electric bike test rides and sales in San Diego',
    'info@sdelectricbike.com',
    '(555) 123-4567',
    '#3B82F6',
    '#1E40AF',
    TRUE,
    NOW()
);

-- Get the shop ID for inserting related data
DO $$
DECLARE
    shop_uuid UUID;
BEGIN
    SELECT id INTO shop_uuid FROM shops WHERE slug = 'sd-electric-bike';
    
    -- Insert default bike inventory for SD Electric Bike
    INSERT INTO bike_inventory (shop_id, model, brand, description, is_available) VALUES
    (shop_uuid, 'Pace 500.3', 'Aventon', 'A comfortable, upright cruiser with impressive power.', TRUE),
    (shop_uuid, 'Turbo Vado 4.0', 'Specialized', 'A premium, smooth-riding commuter for any terrain.', TRUE),
    (shop_uuid, 'Ultimate C380', 'Gazelle', 'Top-tier Dutch comfort and seamless shifting.', TRUE),
    (shop_uuid, 'Adventure Neo', 'Cannondale', 'An accessible, all-road e-bike ready for adventure.', TRUE);
    
    -- Insert default admin user for SD Electric Bike
    INSERT INTO shop_admins (shop_id, email, full_name, role) VALUES
    (shop_uuid, 'admin@sdelectricbike.com', 'SD Electric Bike Admin', 'owner');
END $$;

-- Create a platform super admin (replace with your email)
INSERT INTO platform_admins (email, full_name, role) VALUES
('tom@j2j.info', 'Tom J2J', 'super_admin');