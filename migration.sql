-- Migration script to add missing columns

-- Add teacher_id column to join table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'join' AND column_name = 'teacher_id'
    ) THEN
        ALTER TABLE "join" ADD COLUMN teacher_id INTEGER;
    END IF;
END $$;

-- Add join_id column to activity_detail table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'activity_detail' AND column_name = 'join_id'
    ) THEN
        ALTER TABLE activity_detail ADD COLUMN join_id INTEGER;
    END IF;
END $$;

-- Add foreign key constraints if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'FK_join_teacher'
    ) THEN
        ALTER TABLE "join" ADD CONSTRAINT FK_join_teacher 
        FOREIGN KEY (teacher_id) REFERENCES teacher(teacher_id);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'FK_activity_detail_join'
    ) THEN
        ALTER TABLE activity_detail ADD CONSTRAINT FK_activity_detail_join 
        FOREIGN KEY (join_id) REFERENCES "join"(join_id);
    END IF;
END $$; 

-- Migration to allow NULL values for time_in and time_out in activity_detail table
ALTER TABLE activity_detail ALTER COLUMN time_in DROP NOT NULL;
ALTER TABLE activity_detail ALTER COLUMN time_out DROP NOT NULL; 