-- Rental Feature Migration
-- Adds support for hourly bike rentals alongside test rides

-- Add rental fields to test_drives table
ALTER TABLE test_drives
ADD COLUMN rental_type VARCHAR(20) DEFAULT 'test_ride' CHECK (rental_type IN ('test_ride', 'rental')),
ADD COLUMN rental_duration INTEGER CHECK (rental_duration IN (1, 2) OR rental_duration IS NULL),
ADD COLUMN rental_price DECIMAL(10,2),
ADD COLUMN expected_return_time TIMESTAMP WITH TIME ZONE,
ADD COLUMN returned_at TIMESTAMP WITH TIME ZONE;

-- Add bike category to bike_inventory for pricing
ALTER TABLE bike_inventory
ADD COLUMN bike_category VARCHAR(50) CHECK (bike_category IN ('luxury_ebike', 'ebike', 'escooter'));

-- Update existing bikes with categories (default to 'ebike')
UPDATE bike_inventory SET bike_category = 'ebike' WHERE bike_category IS NULL;

-- Create inventory status view for real-time availability
CREATE VIEW bike_availability AS
SELECT
    bi.id,
    bi.model,
    bi.brand,
    bi.bike_category,
    bi.is_available as manually_available,
    CASE
        WHEN EXISTS (
            SELECT 1 FROM test_drives td
            WHERE td.bike_model = bi.model
            AND td.status = 'active'
            AND (td.rental_type = 'rental' OR td.end_time > NOW())
        ) THEN FALSE
        ELSE bi.is_available
    END as currently_available,
    (
        SELECT json_agg(json_build_object(
            'customer_name', c.name,
            'expected_return', td.expected_return_time,
            'rental_type', td.rental_type
        ))
        FROM test_drives td
        JOIN customers c ON td.customer_id = c.id
        WHERE td.bike_model = bi.model
        AND td.status = 'active'
    ) as current_rentals
FROM bike_inventory bi;

-- Create view for active rentals (admin dashboard)
CREATE VIEW active_rentals AS
SELECT
    td.id,
    td.rental_type,
    td.rental_duration,
    td.rental_price,
    td.bike_model,
    td.start_time,
    td.expected_return_time,
    td.returned_at,
    td.status,
    c.name as customer_name,
    c.phone as customer_phone,
    c.email as customer_email,
    CASE
        WHEN td.expected_return_time < NOW() AND td.returned_at IS NULL THEN TRUE
        ELSE FALSE
    END as is_overdue
FROM test_drives td
JOIN customers c ON td.customer_id = c.id
WHERE td.status = 'active'
ORDER BY td.expected_return_time ASC;

-- Add payment tracking table for rental charges
CREATE TABLE payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    test_drive_id UUID REFERENCES test_drives(id) ON DELETE CASCADE,
    stripe_payment_intent_id VARCHAR(255),
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'usd',
    payment_type VARCHAR(20) CHECK (payment_type IN ('authorization', 'charge')) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'succeeded', 'failed', 'canceled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_test_drives_rental_type ON test_drives(rental_type);
CREATE INDEX idx_test_drives_expected_return ON test_drives(expected_return_time);
CREATE INDEX idx_test_drives_returned_at ON test_drives(returned_at);
CREATE INDEX idx_bike_inventory_category ON bike_inventory(bike_category);
CREATE INDEX idx_payments_customer_id ON payments(customer_id);
CREATE INDEX idx_payments_test_drive_id ON payments(test_drive_id);
CREATE INDEX idx_payments_stripe_id ON payments(stripe_payment_intent_id);

-- Add updated_at trigger for payments
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS on payments
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Staff can manage payments
CREATE POLICY "Staff can manage payments" ON payments
    FOR ALL USING (auth.role() = 'authenticated');

-- Public can create payments (for customer widget)
CREATE POLICY "Anyone can create payments" ON payments
    FOR INSERT WITH CHECK (TRUE);

-- Update the auto-set end_time function to handle rentals
CREATE OR REPLACE FUNCTION set_test_drive_end_time()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.rental_type = 'rental' AND NEW.rental_duration IS NOT NULL THEN
        -- For rentals, set expected_return_time based on duration
        NEW.expected_return_time = NEW.start_time + (NEW.rental_duration || ' hours')::INTERVAL;
        NEW.end_time = NEW.expected_return_time;
    ELSIF NEW.rental_type = 'test_ride' AND NEW.end_time IS NULL AND NEW.start_time IS NOT NULL THEN
        -- For test rides, keep the 30-minute default
        NEW.end_time = NEW.start_time + INTERVAL '30 minutes';
        NEW.expected_return_time = NEW.end_time;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON COLUMN test_drives.rental_type IS 'Type of rental: test_ride (30min, $1 hold) or rental (hourly, full payment)';
COMMENT ON COLUMN test_drives.rental_duration IS 'Duration in hours for rentals (1 or 2), null for test rides';
COMMENT ON COLUMN test_drives.rental_price IS 'Total price charged for rental, null for test rides';
COMMENT ON COLUMN test_drives.expected_return_time IS 'When the bike should be returned';
COMMENT ON COLUMN test_drives.returned_at IS 'Actual return timestamp, set by admin';
COMMENT ON COLUMN bike_inventory.bike_category IS 'Pricing category: luxury_ebike, ebike, or escooter';
