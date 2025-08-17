-- Migration: Add is_unplanned column and rename from is_emergency
-- Run this in your Supabase SQL Editor if you have an existing database

-- Step 1: Add the new column if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'transactions' 
                   AND column_name = 'is_unplanned') THEN
        ALTER TABLE transactions ADD COLUMN is_unplanned BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Step 2: If you have an old is_emergency column, migrate the data
DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'transactions' 
               AND column_name = 'is_emergency') THEN
        -- Copy data from old column to new column
        UPDATE transactions SET is_unplanned = is_emergency;
        -- Drop the old column
        ALTER TABLE transactions DROP COLUMN is_emergency;
    END IF;
END $$;

-- Step 3: Add notes column to categories if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'categories' 
                   AND column_name = 'notes') THEN
        ALTER TABLE categories ADD COLUMN notes TEXT;
    END IF;
END $$;