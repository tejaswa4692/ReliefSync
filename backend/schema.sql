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
    recommended_procedure TEXT,
    is_resolved BOOLEAN DEFAULT FALSE,
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
    phone_number TEXT,
    ngo_member BOOLEAN DEFAULT FALSE,
    ngo_name TEXT,
    ngo_role TEXT,
    ngo_website TEXT,
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

-- 5. Teams table
CREATE TABLE teams (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    image_url VARCHAR(255),
    leader_id UUID REFERENCES volunteers(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Team Members table
CREATE TABLE team_members (
    id SERIAL PRIMARY KEY,
    team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
    volunteer_id UUID REFERENCES volunteers(id) ON DELETE CASCADE,
    is_approved BOOLEAN DEFAULT FALSE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(team_id, volunteer_id)
);

-- Indexes for teams
CREATE INDEX idx_team_members_team_id ON team_members(team_id);
CREATE INDEX idx_team_members_volunteer_id ON team_members(volunteer_id);
