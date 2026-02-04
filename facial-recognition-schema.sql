-- ============================================
-- Facial Recognition Schema Migration
-- ============================================
-- This migration adds facial recognition capabilities to the BJJ tracker app
-- Users can opt-in to store encrypted face embeddings for automatic check-in

-- Add facial recognition columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS face_recognition_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS face_data TEXT, -- Encrypted face embeddings (JSON stringified)
ADD COLUMN IF NOT EXISTS face_enrollment_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS face_last_updated TIMESTAMP WITH TIME ZONE;

-- Create check_ins table if it doesn't exist
CREATE TABLE IF NOT EXISTS check_ins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    academy_id UUID REFERENCES academies(id) ON DELETE SET NULL,
    check_in_date DATE NOT NULL,
    check_in_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    method VARCHAR(50) DEFAULT 'manual', -- 'manual', 'face_recognition', 'qr_code'
    confidence_score DECIMAL(5,2), -- For face recognition, stores matching confidence
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_check_ins_user_date ON check_ins(user_id, check_in_date);
CREATE INDEX IF NOT EXISTS idx_check_ins_academy_date ON check_ins(academy_id, check_in_date);

-- RLS Policies for check_ins
ALTER TABLE check_ins ENABLE ROW LEVEL SECURITY;

-- Users can view their own check-ins
CREATE POLICY "check_ins_view_own" ON check_ins
    FOR SELECT 
    USING (auth.uid() = user_id);

-- Users can create their own check-ins
CREATE POLICY "check_ins_create_own" ON check_ins
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- Professors/owners can view check-ins for their academy members
CREATE POLICY "check_ins_view_academy" ON check_ins
    FOR SELECT
    USING (
        academy_id IN (
            SELECT id FROM academies WHERE owner_id = auth.uid()
        )
    );

-- Create function to prevent duplicate check-ins on same day
CREATE OR REPLACE FUNCTION prevent_duplicate_checkin()
RETURNS TRIGGER AS $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM check_ins 
        WHERE user_id = NEW.user_id 
        AND check_in_date = NEW.check_in_date
    ) THEN
        RAISE EXCEPTION 'User has already checked in today';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger
DROP TRIGGER IF EXISTS prevent_duplicate_checkin_trigger ON check_ins;
CREATE TRIGGER prevent_duplicate_checkin_trigger
    BEFORE INSERT ON check_ins
    FOR EACH ROW
    EXECUTE FUNCTION prevent_duplicate_checkin();

-- Add comment for documentation
COMMENT ON COLUMN profiles.face_data IS 'Encrypted facial embeddings stored as JSON string. Contains array of 128-dimension face descriptors from face-api.js';
COMMENT ON COLUMN profiles.face_recognition_enabled IS 'User consent flag for facial recognition. Must be explicitly enabled by user.';
COMMENT ON TABLE check_ins IS 'Stores all check-in records with method tracking (manual vs facial recognition)';
