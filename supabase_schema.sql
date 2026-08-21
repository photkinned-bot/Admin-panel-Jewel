-- Create orders table
CREATE TABLE orders (
    id UUID PRIMARY KEY,
    orderNumber TEXT,
    itemName TEXT,
    clientName TEXT,
    clientPhone TEXT,
    status TEXT,
    deadline TIMESTAMP WITH TIME ZONE,
    totalAmount NUMERIC,
    advance NUMERIC,
    materials JSONB,
    photos JSONB,
    payments JSONB DEFAULT '[]'::jsonb,
    expenses JSONB DEFAULT '[]'::jsonb,
    description TEXT,
    notes TEXT,
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    catalogItemId UUID,
    colorTag TEXT
);

-- Create catalog table
CREATE TABLE catalog (
    id UUID PRIMARY KEY,
    modelId TEXT,
    name TEXT,
    description TEXT,
    baseMaterials JSONB,
    photos JSONB,
    baseLaborCost NUMERIC,
    complexity TEXT
);

-- Enable RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalog ENABLE ROW LEVEL SECURITY;

-- Create policies (Allow all for now, but should be refined for production)
CREATE POLICY "Allow all access" ON orders FOR ALL USING (true);
CREATE POLICY "Allow all access" ON catalog FOR ALL USING (true);
