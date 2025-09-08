-- Initial database schema for config service

-- Create migrations table to track applied migrations
CREATE TABLE IF NOT EXISTS migrations (
    id SERIAL PRIMARY KEY,
    version VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create applications table
CREATE TABLE IF NOT EXISTS applications (
    id VARCHAR(26) PRIMARY KEY,  -- ULID format
    name VARCHAR(256) NOT NULL UNIQUE,
    comments VARCHAR(1024),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create configurations table
CREATE TABLE IF NOT EXISTS configurations (
    id VARCHAR(26) PRIMARY KEY,  -- ULID format
    application_id VARCHAR(26) NOT NULL,
    name VARCHAR(256) NOT NULL,
    comments VARCHAR(1024),
    config JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE,
    UNIQUE(application_id, name)  -- Unique configuration name per application
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_configurations_application_id ON configurations(application_id);
CREATE INDEX IF NOT EXISTS idx_configurations_name ON configurations(name);
CREATE INDEX IF NOT EXISTS idx_configurations_config ON configurations USING GIN (config);

-- Insert initial migration record
INSERT INTO migrations (version, description) 
VALUES ('001', 'Initial schema with applications and configurations tables')
ON CONFLICT (version) DO NOTHING;
