-- Database Schema for ReliefSync

-- Issues table to store processed reports
CREATE TABLE issues (
    id SERIAL PRIMARY KEY,
    issue_type VARCHAR(255) NOT NULL,
    severity INTEGER CHECK (severity >= 1 AND severity <= 5),
    urgency VARCHAR(50),
    location VARCHAR(255),
    people_affected INTEGER,
    summary TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Raw reports table for initial ingestion
CREATE TABLE raw_reports (
    id SERIAL PRIMARY KEY,
    content TEXT NOT NULL,
    processed BOOLEAN DEFAULT FALSE,
    issue_id INTEGER REFERENCES issues(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Volunteers Table (Linked to Supabase Auth)
CREATE TABLE volunteers (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    location TEXT NOT NULL,
    skills TEXT[] DEFAULT '{}',
    availability TEXT DEFAULT 'available',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Assignments matching volunteers to issues
CREATE TABLE assignments (
    id SERIAL PRIMARY KEY,
    volunteer_id UUID REFERENCES volunteers(id),
    issue_id INTEGER REFERENCES issues(id),
    status VARCHAR(50) DEFAULT 'assigned',
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_issues_created_at ON issues(created_at);
CREATE INDEX idx_issues_type_location ON issues(issue_type, location);
CREATE INDEX idx_volunteers_location ON volunteers(location);
CREATE INDEX idx_volunteers_skills ON volunteers USING GIN (skills);

-- Enable RLS (Row Level Security)
ALTER TABLE volunteers ENABLE ROW LEVEL SECURITY;

-- Policies for Volunteers
CREATE POLICY "Profiles are viewable by everyone" ON volunteers
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" ON volunteers
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON volunteers
    FOR UPDATE USING (auth.uid() = id);
