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

-- Sample data for testing (optional)
INSERT INTO branches (name, location, manager_name, phone) VALUES 
    ('สาขาเชียงใหม่', 'เชียงใหม่, ประเทศไทย', 'สมชาย ใจดี', '081-234-5678'),
    ('สาขากรุงเทพ', 'กรุงเทพมหานคร, ประเทศไทย', 'สมหญิง รักงาน', '082-345-6789'),
    ('สาขาภูเก็ต', 'ภูเก็ต, ประเทศไทย', 'สมศักดิ์ ขยัน', '083-456-7890');

INSERT INTO products (batch_number, branch_id, status) 
SELECT 
    'COC-SAMPLE-001',
    b.id,
    'completed'
FROM branches b WHERE b.name = 'สาขาเชียงใหม่'
LIMIT 1;

INSERT INTO products (batch_number, branch_id, status) 
SELECT 
    'COC-SAMPLE-002',
    b.id,
    'in_production'
FROM branches b WHERE b.name = 'สาขากรุงเทพ'
LIMIT 1;

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
    'fermentation',
    'Fermentation',
    '{"fermentation_start": "2024-06-16", "fermentation_duration": 7, "temperature": 45, "humidity": 85, "fermentation_notes": "Proper fermentation achieved"}'::jsonb
FROM products p WHERE p.batch_number = 'COC-SAMPLE-001';

INSERT INTO production_stages (product_id, stage_id, stage_name, stage_data) 
SELECT 
    p.id,
    'packaging',
    'Packaging',
    '{"packaging_date": "2024-07-01", "package_type": "Premium Chocolate Bar", "package_size": "100g", "batch_number": "COC-SAMPLE-001", "expiry_date": "2025-07-01"}'::jsonb
FROM products p WHERE p.batch_number = 'COC-SAMPLE-001';
