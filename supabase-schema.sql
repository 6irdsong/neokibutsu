-- Supabase PostgreSQL schema for neo鬼仏表
-- Run this in Supabase SQL Editor to create the tables

CREATE TABLE IF NOT EXISTS posts (
  id SERIAL PRIMARY KEY,
  date TEXT,
  subject TEXT NOT NULL,
  teacher TEXT,
  author TEXT DEFAULT '匿名',
  rating TEXT,
  test TEXT,
  report TEXT,
  attendance TEXT,
  evaluation TEXT,
  assignment TEXT,
  comment TEXT,
  ip TEXT,
  created_at TEXT,
  device_id TEXT,
  category VARCHAR(20) DEFAULT '全学教育科目'
);

CREATE INDEX IF NOT EXISTS idx_posts_category ON posts (category);
CREATE INDEX IF NOT EXISTS idx_posts_device_id ON posts (device_id);

CREATE TABLE IF NOT EXISTS banned_devices (
  device_id VARCHAR(255) PRIMARY KEY,
  created_at TEXT
);

CREATE TABLE IF NOT EXISTS reports (
  id SERIAL PRIMARY KEY,
  post_id INTEGER NOT NULL DEFAULT 0,
  subject TEXT,
  reason TEXT NOT NULL,
  reporter_device_id VARCHAR(255),
  reporter_anonymous_id VARCHAR(64),
  reporter_sus_count INTEGER,
  reporter_device_created VARCHAR(20),
  target_device_id VARCHAR(255),
  status VARCHAR(20) DEFAULT 'pending',
  admin_response TEXT,
  created_at TEXT,
  resolved_at TEXT
);

CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  device_id VARCHAR(255) NOT NULL,
  anonymous_id VARCHAR(64),
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_notifications_device_id ON notifications (device_id);
CREATE INDEX IF NOT EXISTS idx_notifications_anonymous_id ON notifications (anonymous_id);

-- Likes
ALTER TABLE posts ADD COLUMN IF NOT EXISTS like_count INTEGER DEFAULT 0;

CREATE TABLE IF NOT EXISTS post_likes (
  post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  device_id VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (post_id, device_id)
);

CREATE INDEX IF NOT EXISTS idx_post_likes_device_id ON post_likes (device_id);

-- Bookmarks
CREATE TABLE IF NOT EXISTS post_bookmarks (
  post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  anonymous_id VARCHAR(64) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (post_id, anonymous_id)
);

CREATE INDEX IF NOT EXISTS idx_post_bookmarks_anonymous_id ON post_bookmarks (anonymous_id);

-- Dislikes
ALTER TABLE posts ADD COLUMN IF NOT EXISTS dislike_count INTEGER DEFAULT 0;

CREATE TABLE IF NOT EXISTS post_dislikes (
  post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  device_id VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (post_id, device_id)
);

CREATE INDEX IF NOT EXISTS idx_post_dislikes_device_id ON post_dislikes (device_id);
