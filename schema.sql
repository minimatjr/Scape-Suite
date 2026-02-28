-- ============================================================
-- SCAPE SUITE DATABASE SCHEMA
-- Supabase PostgreSQL Database Setup
-- ============================================================

-- Enable UUID extension for generating unique IDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- CONTACTS TABLE
-- Stores all client/customer contact information
-- ============================================================
CREATE TABLE IF NOT EXISTS contacts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Contact Information
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    company VARCHAR(200),
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    
    -- Address Information
    address VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(50),
    zip VARCHAR(20),
    country VARCHAR(100) DEFAULT 'USA',
    
    -- Additional Information
    notes TEXT,
    tags VARCHAR(255)[], -- Array of tags for categorization
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- ============================================================
-- PROJECTS TABLE
-- Stores project information linked to contacts
-- ============================================================
CREATE TYPE project_status AS ENUM (
    'pending',
    'in_progress', 
    'completed',
    'on_hold',
    'cancelled'
);

CREATE TABLE IF NOT EXISTS projects (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    
    -- Project Information
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status project_status DEFAULT 'pending',
    
    -- Financial Information
    total_value DECIMAL(12, 2),
    currency VARCHAR(3) DEFAULT 'USD',
    
    -- Timeline
    start_date DATE,
    end_date DATE,
    
    -- Location (can be different from contact address)
    project_address VARCHAR(255),
    project_city VARCHAR(100),
    project_state VARCHAR(50),
    project_zip VARCHAR(20),
    
    -- Additional Information
    notes TEXT,
    tags VARCHAR(255)[],
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- DOCUMENTS TABLE
-- Stores document metadata (quotes, invoices, contracts, etc.)
-- ============================================================
CREATE TYPE document_type AS ENUM (
    'quote',
    'invoice',
    'contract',
    'work_order',
    'estimate',
    'receipt',
    'other'
);

CREATE TYPE document_status AS ENUM (
    'draft',
    'sent',
    'viewed',
    'accepted',
    'rejected',
    'paid',
    'overdue',
    'cancelled'
);

CREATE TABLE IF NOT EXISTS documents (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    
    -- Document Information
    type document_type NOT NULL,
    name VARCHAR(255) NOT NULL,
    document_number VARCHAR(50), -- Invoice #, Quote #, etc.
    status document_status DEFAULT 'draft',
    
    -- Financial Information
    subtotal DECIMAL(12, 2),
    tax_rate DECIMAL(5, 2),
    tax_amount DECIMAL(12, 2),
    discount_amount DECIMAL(12, 2),
    total DECIMAL(12, 2),
    
    -- Dates
    issue_date DATE,
    due_date DATE,
    valid_until DATE, -- For quotes/estimates
    
    -- Content (stored as JSONB for flexibility)
    line_items JSONB DEFAULT '[]'::jsonb,
    terms_and_conditions TEXT,
    notes TEXT,
    
    -- File Storage
    pdf_url TEXT, -- URL to generated PDF in Supabase Storage
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- DOCUMENT LINE ITEMS TABLE (Alternative to JSONB)
-- For more structured querying of line items
-- ============================================================
CREATE TABLE IF NOT EXISTS document_line_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    
    -- Item Information
    position INTEGER NOT NULL, -- Order in the document
    description TEXT NOT NULL,
    quantity DECIMAL(10, 2) DEFAULT 1,
    unit VARCHAR(50), -- hours, sqft, units, etc.
    unit_price DECIMAL(12, 2) NOT NULL,
    total DECIMAL(12, 2) NOT NULL,
    
    -- Optional categorization
    category VARCHAR(100),
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- USER BUSINESS SETTINGS TABLE
-- Stores user's business information for documents
-- ============================================================
CREATE TABLE IF NOT EXISTS user_business_settings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Business Information
    business_name VARCHAR(255),
    business_address VARCHAR(255),
    business_city VARCHAR(100),
    business_state VARCHAR(50),
    business_zip VARCHAR(20),
    business_phone VARCHAR(50),
    business_email VARCHAR(255),
    business_website VARCHAR(255),
    
    -- Tax Information
    tax_id VARCHAR(50), -- EIN, SSN, etc.
    default_tax_rate DECIMAL(5, 2) DEFAULT 0,
    
    -- Branding
    logo_url TEXT,
    primary_color VARCHAR(7) DEFAULT '#245234', -- Hex color
    
    -- Document Settings
    default_payment_terms TEXT,
    default_notes TEXT,
    invoice_prefix VARCHAR(10) DEFAULT 'INV-',
    quote_prefix VARCHAR(10) DEFAULT 'QT-',
    
    -- Numbering
    next_invoice_number INTEGER DEFAULT 1001,
    next_quote_number INTEGER DEFAULT 1001,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================

-- Contacts indexes
CREATE INDEX idx_contacts_user_id ON contacts(user_id);
CREATE INDEX idx_contacts_email ON contacts(email);
CREATE INDEX idx_contacts_company ON contacts(company);
CREATE INDEX idx_contacts_created_at ON contacts(created_at DESC);

-- Projects indexes
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_contact_id ON projects(contact_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_created_at ON projects(created_at DESC);

-- Documents indexes
CREATE INDEX idx_documents_user_id ON documents(user_id);
CREATE INDEX idx_documents_project_id ON documents(project_id);
CREATE INDEX idx_documents_contact_id ON documents(contact_id);
CREATE INDEX idx_documents_type ON documents(type);
CREATE INDEX idx_documents_status ON documents(status);
CREATE INDEX idx_documents_created_at ON documents(created_at DESC);

-- Line items index
CREATE INDEX idx_line_items_document_id ON document_line_items(document_id);

-- ============================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Ensures users can only access their own data
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_business_settings ENABLE ROW LEVEL SECURITY;

-- Contacts policies
CREATE POLICY "Users can view their own contacts"
    ON contacts FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own contacts"
    ON contacts FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own contacts"
    ON contacts FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own contacts"
    ON contacts FOR DELETE
    USING (auth.uid() = user_id);

-- Projects policies
CREATE POLICY "Users can view their own projects"
    ON projects FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own projects"
    ON projects FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects"
    ON projects FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects"
    ON projects FOR DELETE
    USING (auth.uid() = user_id);

-- Documents policies
CREATE POLICY "Users can view their own documents"
    ON documents FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own documents"
    ON documents FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own documents"
    ON documents FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own documents"
    ON documents FOR DELETE
    USING (auth.uid() = user_id);

-- Line items policies (through document ownership)
CREATE POLICY "Users can view line items for their documents"
    ON document_line_items FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM documents 
            WHERE documents.id = document_line_items.document_id 
            AND documents.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert line items for their documents"
    ON document_line_items FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM documents 
            WHERE documents.id = document_line_items.document_id 
            AND documents.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update line items for their documents"
    ON document_line_items FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM documents 
            WHERE documents.id = document_line_items.document_id 
            AND documents.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete line items for their documents"
    ON document_line_items FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM documents 
            WHERE documents.id = document_line_items.document_id 
            AND documents.user_id = auth.uid()
        )
    );

-- Business settings policies
CREATE POLICY "Users can view their own business settings"
    ON user_business_settings FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own business settings"
    ON user_business_settings FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own business settings"
    ON user_business_settings FOR UPDATE
    USING (auth.uid() = user_id);

-- ============================================================
-- TRIGGERS FOR AUTOMATIC TIMESTAMPS
-- ============================================================

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to all tables with updated_at
CREATE TRIGGER update_contacts_updated_at
    BEFORE UPDATE ON contacts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at
    BEFORE UPDATE ON documents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_business_settings_updated_at
    BEFORE UPDATE ON user_business_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

-- Function to get the next document number and increment it
CREATE OR REPLACE FUNCTION get_next_document_number(
    p_user_id UUID,
    p_doc_type TEXT
)
RETURNS TEXT AS $$
DECLARE
    v_prefix TEXT;
    v_next_num INTEGER;
    v_result TEXT;
BEGIN
    IF p_doc_type = 'invoice' THEN
        SELECT invoice_prefix, next_invoice_number 
        INTO v_prefix, v_next_num
        FROM user_business_settings 
        WHERE user_id = p_user_id;
        
        UPDATE user_business_settings 
        SET next_invoice_number = next_invoice_number + 1 
        WHERE user_id = p_user_id;
    ELSE
        SELECT quote_prefix, next_quote_number 
        INTO v_prefix, v_next_num
        FROM user_business_settings 
        WHERE user_id = p_user_id;
        
        UPDATE user_business_settings 
        SET next_quote_number = next_quote_number + 1 
        WHERE user_id = p_user_id;
    END IF;
    
    v_result := COALESCE(v_prefix, 'DOC-') || LPAD(COALESCE(v_next_num, 1)::TEXT, 4, '0');
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
