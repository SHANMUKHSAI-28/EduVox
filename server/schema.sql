-- EduVox Database Schema
-- Run this script to create the necessary tables

-- Create extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User profiles table (complementing Firebase Auth)
CREATE TABLE IF NOT EXISTS user_profiles (
  id VARCHAR(128) PRIMARY KEY, -- Firebase UID
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  role VARCHAR(20) DEFAULT 'student' CHECK (role IN ('student', 'consultant', 'admin')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Academic profile for students
CREATE TABLE IF NOT EXISTS user_profiles_academic (
  user_id VARCHAR(128) REFERENCES user_profiles(id) ON DELETE CASCADE PRIMARY KEY,
  cgpa DECIMAL(3,2),
  ielts_score DECIMAL(2,1),
  toefl_score INTEGER,
  gre_score INTEGER,
  budget_min INTEGER,
  budget_max INTEGER,
  preferred_countries TEXT[], -- Array of country names
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Universities table
CREATE TABLE IF NOT EXISTS universities (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  country VARCHAR(100) NOT NULL,
  state VARCHAR(100),
  city VARCHAR(100),
  type VARCHAR(20) CHECK (type IN ('public', 'private')),
  ranking INTEGER,
  tuition_min INTEGER,
  tuition_max INTEGER,
  cgpa_requirement DECIMAL(3,2),
  ielts_requirement DECIMAL(2,1),
  toefl_requirement INTEGER,
  gre_requirement INTEGER,
  application_deadline DATE,
  website VARCHAR(255),
  logo_url VARCHAR(255),
  description TEXT,
  programs TEXT[], -- Array of program names
  created_at TIMESTAMP DEFAULT NOW()
);

-- Saved universities by users
CREATE TABLE IF NOT EXISTS saved_universities (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(128) REFERENCES user_profiles(id) ON DELETE CASCADE,
  university_id INTEGER REFERENCES universities(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, university_id)
);

-- University comparisons (for future feature)
CREATE TABLE IF NOT EXISTS university_comparisons (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(128) REFERENCES user_profiles(id) ON DELETE CASCADE,
  university_ids INTEGER[] NOT NULL, -- Array of university IDs
  comparison_name VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Payment transactions (for future Razorpay integration)
CREATE TABLE IF NOT EXISTS payment_transactions (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(128) REFERENCES user_profiles(id) ON DELETE CASCADE,
  razorpay_order_id VARCHAR(255),
  razorpay_payment_id VARCHAR(255),
  amount INTEGER NOT NULL, -- Amount in paise
  currency VARCHAR(3) DEFAULT 'INR',
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed', 'refunded')),
  service_type VARCHAR(50), -- Type of service paid for
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_universities_country ON universities(country);
CREATE INDEX IF NOT EXISTS idx_universities_ranking ON universities(ranking);
CREATE INDEX IF NOT EXISTS idx_universities_type ON universities(type);
CREATE INDEX IF NOT EXISTS idx_saved_universities_user_id ON saved_universities(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_user_id ON payment_transactions(user_id);

-- Insert sample universities data (you can expand this)
INSERT INTO universities (name, country, state, city, type, ranking, tuition_min, tuition_max, cgpa_requirement, ielts_requirement, toefl_requirement, website, description) VALUES
-- US Universities
('Harvard University', 'United States', 'Massachusetts', 'Cambridge', 'private', 1, 45000, 55000, 3.7, 7.0, 100, 'https://harvard.edu', 'Prestigious Ivy League university known for excellence in education and research.'),
('Stanford University', 'United States', 'California', 'Stanford', 'private', 2, 50000, 60000, 3.8, 7.0, 100, 'https://stanford.edu', 'Leading university in technology and innovation in Silicon Valley.'),
('MIT', 'United States', 'Massachusetts', 'Cambridge', 'private', 3, 48000, 58000, 3.8, 7.0, 100, 'https://mit.edu', 'World-renowned institution for science, technology, engineering, and mathematics.'),
('University of California, Berkeley', 'United States', 'California', 'Berkeley', 'public', 4, 25000, 45000, 3.5, 6.5, 90, 'https://berkeley.edu', 'Top public research university with strong programs across disciplines.'),

-- UK Universities  
('University of Oxford', 'United Kingdom', 'England', 'Oxford', 'public', 5, 25000, 40000, 3.6, 7.0, 100, 'https://ox.ac.uk', 'Ancient university with centuries of academic excellence.'),
('University of Cambridge', 'United Kingdom', 'England', 'Cambridge', 'public', 6, 25000, 40000, 3.6, 7.0, 100, 'https://cam.ac.uk', 'Historic university known for research and academic tradition.'),
('Imperial College London', 'United Kingdom', 'England', 'London', 'public', 7, 30000, 45000, 3.5, 6.5, 95, 'https://imperial.ac.uk', 'Leading institution for science, engineering, medicine and business.'),
('London School of Economics', 'United Kingdom', 'England', 'London', 'public', 8, 28000, 42000, 3.4, 7.0, 100, 'https://lse.ac.uk', 'World-class social sciences university in the heart of London.'),

-- Canada Universities
('University of Toronto', 'Canada', 'Ontario', 'Toronto', 'public', 9, 35000, 50000, 3.3, 6.5, 89, 'https://utoronto.ca', 'Canada''s leading university with strong research programs.'),
('University of British Columbia', 'Canada', 'British Columbia', 'Vancouver', 'public', 10, 30000, 45000, 3.2, 6.5, 90, 'https://ubc.ca', 'Top Canadian university known for research and beautiful campus.'),
('McGill University', 'Canada', 'Quebec', 'Montreal', 'public', 11, 25000, 40000, 3.3, 6.5, 86, 'https://mcgill.ca', 'Internationally recognized university with diverse student body.'),

-- Australia Universities
('University of Melbourne', 'Australia', 'Victoria', 'Melbourne', 'public', 12, 25000, 40000, 3.2, 6.5, 79, 'https://unimelb.edu.au', 'Leading Australian university with strong international reputation.'),
('Australian National University', 'Australia', 'ACT', 'Canberra', 'public', 13, 30000, 45000, 3.3, 6.5, 80, 'https://anu.edu.au', 'Australia''s national university with excellence in research.'),
('University of Sydney', 'Australia', 'New South Wales', 'Sydney', 'public', 14, 28000, 42000, 3.1, 6.5, 85, 'https://sydney.edu.au', 'Historic university with beautiful campus and strong programs.')

ON CONFLICT DO NOTHING;
