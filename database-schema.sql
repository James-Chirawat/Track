-- Cocoa Production Tracking Database Schema
-- This schema should be created in your Supabase database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Branches table - Different production branches/locations
CREATE TABLE branches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    location VARCHAR(200),
    manager_name VARCHAR(100),
    phone VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Products table - Main product/batch tracking
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_number VARCHAR(100) UNIQUE NOT NULL,
    branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'in_production' CHECK (status IN ('in_production', 'completed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Production stages table - Individual stage records
CREATE TABLE production_stages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    stage_id VARCHAR(50) NOT NULL,
    stage_name VARCHAR(100) NOT NULL,
    stage_data JSONB NOT NULL DEFAULT '{}',
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_branches_name ON branches(name);
CREATE INDEX idx_products_batch_number ON products(batch_number);
CREATE INDEX idx_products_branch_id ON products(branch_id);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_created_at ON products(created_at);
CREATE INDEX idx_production_stages_product_id ON production_stages(product_id);
CREATE INDEX idx_production_stages_stage_id ON production_stages(stage_id);
CREATE INDEX idx_production_stages_recorded_at ON production_stages(recorded_at);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for products table
CREATE TRIGGER update_products_updated_at 
    BEFORE UPDATE ON products 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_stages ENABLE ROW LEVEL SECURITY;

-- Allow public read access (for QR code scanning)
CREATE POLICY "Allow public read access on branches" ON branches
    FOR SELECT USING (true);

CREATE POLICY "Allow public read access on products" ON products
    FOR SELECT USING (true);

CREATE POLICY "Allow public read access on production_stages" ON production_stages
    FOR SELECT USING (true);

-- Allow public insert/update for production tracking
CREATE POLICY "Allow public insert on branches" ON branches
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update on branches" ON branches
    FOR UPDATE USING (true);

CREATE POLICY "Allow public insert on products" ON products
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update on products" ON products
    FOR UPDATE USING (true);

CREATE POLICY "Allow public insert on production_stages" ON production_stages
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update on production_stages" ON production_stages
    FOR UPDATE USING (true);

-- Sample data for testing - 15 Enterprise Names (วิสาหกิจชุมชน)
INSERT INTO branches (name, location, manager_name, phone) VALUES 
    ('วิสาหกิจชุมชนรักษ์ดินทอง', 'พิษณุโลก, ประเทศไทย', NULL, NULL),
    ('วิสาหกิจชุมชนสวนไผ่พลังงานพัฒนาตำบลชัยนาม', 'พิษณุโลก, ประเทศไทย', NULL, NULL),
    ('วิสาหกิจชุมชนเศรษฐกิจพอเพียงแบบยั่งยืนอำเภอวังทอง', 'พิษณุโลก, ประเทศไทย', NULL, NULL),
    ('วิสาหกิจชุมชนบ้านเนินสะอาดไร่นาสวนผสม', 'พิษณุโลก, ประเทศไทย', NULL, NULL),
    ('วิสาหกิจชุมชนธิดาผักปลอดภัย', 'พิษณุโลก, ประเทศไทย', NULL, NULL),
    ('วิสาหกิจชุมชนเกษตรอินทรีย์ N-DO Fulltime', 'พิษณุโลก, ประเทศไทย', NULL, NULL),
    ('วิสาหกิจชุมชน Society farm', 'พิษณุโลก, ประเทศไทย', NULL, NULL),
    ('วิสาหกิจชุมชนดองได้ดองดี', 'พิษณุโลก, ประเทศไทย', NULL, NULL),
    ('วิสาหกิจชุมชนไร่ฟุ้งเฟื่องเมืองบางขลัง', 'สุโขทัย, ประเทศไทย', NULL, NULL),
    ('วิสาหกิจชุมชนพืชสมุนไพรนครบางขลัง', 'สุโขทัย, ประเทศไทย', NULL, NULL),
    ('วิสาหกิจชุมชนผักปลอดภัยจากสารพิษตำบลเกาะตาเลี้ยง', 'สุโขทัย, ประเทศไทย', NULL, NULL),
    ('วิสาหกิจชุมชนบ้านแจ่มจ้า เมืองบางขลัง', 'สุโขทัย, ประเทศไทย', NULL, NULL),
    ('วิสาหกิจบ้านสวนคุณทองเพียร', 'พิษณุโลก, ประเทศไทย', NULL, NULL),
    ('วิสาหกิจชุมชนปลูกและแปรรูปสมุนไพรทับยายเชียง', 'พิษณุโลก, ประเทศไทย', NULL, NULL),
    ('วิสาหกิจชุมชนเกษตรสุขใจ (แทนศูนย์เรียนรู้ดินและปุ๋ยชุมชนตำบลบ้านกร่าง)', 'พิษณุโลก, ประเทศไทย', NULL, NULL);

INSERT INTO products (batch_number, branch_id, status) 
SELECT 
    'COC-SAMPLE-001',
    b.id,
    'completed'
FROM branches b WHERE b.name = 'วิสาหกิจชุมชนรักษ์ดินทอง'
LIMIT 1;

INSERT INTO products (batch_number, branch_id, status) 
SELECT 
    'COC-SAMPLE-002',
    b.id,
    'in_production'
FROM branches b WHERE b.name = 'วิสาหกิจชุมชนสวนไผ่พลังงานพัฒนาตำบลชัยนาม'
LIMIT 1;

-- Daily Cultivation Records table - For organic water fern tracking
CREATE TABLE IF NOT EXISTS daily_cultivation_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    enterprise_name VARCHAR(200) NOT NULL,
    cycle_number INTEGER,
    start_date DATE,
    day_number INTEGER CHECK (day_number BETWEEN 1 AND 14),
    recorder_name VARCHAR(100),
    activities JSONB DEFAULT '{}',
    -- Section 1: Pre-cultivation water resting
    section1_data JSONB DEFAULT '{}',
    -- Section 2: Mother strain quantity
    section2_data JSONB DEFAULT '{}',
    -- Section 3: pH measurements
    section3_data JSONB DEFAULT '{}',
    -- Section 4: Fertilizer/nutrients
    section4_data JSONB DEFAULT '{}',
    -- Section 5: Water fern characteristics
    section5_data JSONB DEFAULT '{}',
    -- Section 6: Harvest data
    section6_data JSONB DEFAULT '{}',
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for daily_cultivation_records
CREATE INDEX IF NOT EXISTS idx_daily_records_enterprise ON daily_cultivation_records(enterprise_name);
CREATE INDEX IF NOT EXISTS idx_daily_records_cycle ON daily_cultivation_records(cycle_number);
CREATE INDEX IF NOT EXISTS idx_daily_records_date ON daily_cultivation_records(recorded_at);
CREATE INDEX IF NOT EXISTS idx_daily_records_day ON daily_cultivation_records(day_number);

-- Enable RLS for daily_cultivation_records
ALTER TABLE daily_cultivation_records ENABLE ROW LEVEL SECURITY;

-- RLS policies for daily_cultivation_records
CREATE POLICY "Allow public read access on daily_cultivation_records" ON daily_cultivation_records
    FOR SELECT USING (true);

CREATE POLICY "Allow public insert on daily_cultivation_records" ON daily_cultivation_records
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update on daily_cultivation_records" ON daily_cultivation_records
    FOR UPDATE USING (true);

-- Create trigger for daily_cultivation_records updated_at
CREATE TRIGGER update_daily_cultivation_records_updated_at 
    BEFORE UPDATE ON daily_cultivation_records 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Sample production stages for the completed product
INSERT INTO production_stages (product_id, stage_id, stage_name, stage_data) 
SELECT 
    p.id,
    'planting',
    'Planting',
    '{"farm_location": "Northern Thailand", "planting_date": "2024-01-15", "seed_variety": "Trinitario", "farmer_name": "John Farmer", "farm_size": 5}'::jsonb
FROM products p WHERE p.batch_number = 'COC-SAMPLE-001';

INSERT INTO production_stages (product_id, stage_id, stage_name, stage_data) 
SELECT 
    p.id,
    'harvesting',
    'Harvesting',
    '{"harvest_date": "2024-06-15", "harvest_quantity": 500, "quality_grade": "Premium", "harvest_notes": "Excellent quality harvest with optimal ripeness"}'::jsonb
FROM products p WHERE p.batch_number = 'COC-SAMPLE-001';

INSERT INTO production_stages (product_id, stage_id, stage_name, stage_data) 
SELECT 
    p.id,
    'fresh_packaging',
    'Fresh Packaging',
    '{"packaging_date": "2024-06-16", "packaging_weight": 5, "packaging_type": "ถุงพลาสติก", "storage_temp": 4, "fresh_packaging_notes": "บรรจุแบบสดพร้อมจำหน่าย"}'::jsonb
FROM products p WHERE p.batch_number = 'COC-SAMPLE-001';

INSERT INTO production_stages (product_id, stage_id, stage_name, stage_data) 
SELECT 
    p.id,
    'b2b',
    'B2B',
    '{"distribution_date": "2024-07-01", "destination": "ตลาดสด พิษณุโลก", "buyer_name": "ร้านค้าส่งผักสด", "distributor_name": "นายสมชาย ใจดี", "enterprise_name": "วิสาหกิจชุมชนรักษ์ดินทอง", "shipping_cost": 150, "quantity": 10, "total_price": 1500, "notes": "ส่งมอบเรียบร้อย"}'::jsonb
FROM products p WHERE p.batch_number = 'COC-SAMPLE-001';

-- Add number_of_ponds column to daily_cultivation_records (for dynamic pond count)
ALTER TABLE daily_cultivation_records 
ADD COLUMN IF NOT EXISTS number_of_ponds INTEGER DEFAULT 0;
