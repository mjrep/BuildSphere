-- Run this in psql or pgAdmin Query Tool
-- First create the database (run this separately if needed):
-- CREATE DATABASE buildsphere;

-- Connect to buildsphere database then run the rest:

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS projects (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#FFD6F3',
  status TEXT NOT NULL DEFAULT 'ongoing',
  engineer TEXT,
  start_date TEXT,
  end_date TEXT,
  budget NUMERIC,
  progress INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tasks (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  project TEXT NOT NULL,
  due_date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  priority TEXT NOT NULL DEFAULT 'medium',
  description TEXT,
  assigned_to TEXT,
  phase TEXT,
  milestone TEXT,
  start_date TEXT,
  user_id INTEGER REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  type TEXT NOT NULL DEFAULT 'update',
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  time TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  user_id INTEGER REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS site_progress (
  id SERIAL PRIMARY KEY,
  project_name TEXT NOT NULL,
  partner TEXT,
  milestone TEXT,
  location TEXT,
  notes TEXT,
  photo_url TEXT,
  glass_count INTEGER DEFAULT 0,
  user_id INTEGER REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sample projects data
INSERT INTO projects (name, location, color) VALUES
  ('Project Name', 'Glassworks', '#FFD6F3'),
  ('City Tower A', 'Downtown', '#E5D4FF'),
  ('River Side Base', 'Industrial', '#D4E5FF');
