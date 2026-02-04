# Storage Setup Fix

## Problem
The original `setup-storage-bucket.sql` script was failing with the error:
```
Error: Failed to run sql query: ERROR: 42501: must be owner of table objects
```

This occurred because the script contained commands that require database owner permissions, which regular Supabase users don't have.

## Solution
Created `setup-storage-bucket-fixed.sql` which removes the problematic commands while maintaining the same functionality.

## Key Changes

### Removed Commands (Required Owner Permissions):
1. **`ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;`**
   - Supabase already has RLS enabled by default on storage tables
   
2. **`DROP POLICY` statements**
   - Replaced with DO blocks that check if policies exist before creating them
   
3. **`GRANT` statements**
   - Supabase manages storage permissions automatically through policies
   - Manual GRANTs on system tables aren't needed and require elevated permissions

### Technical Implementation:
- Each policy creation is wrapped in a `DO $$ ... END $$;` block
- Uses `pg_policies` system view to check if a policy already exists
- Only creates the policy if it doesn't exist, avoiding duplicate errors
- This approach works around the fact that `CREATE POLICY IF NOT EXISTS` is not valid SQL syntax

### What the Fixed Script Does:
- ✅ Creates the `avatars` storage bucket (if it doesn't exist)
- ✅ Creates policies for public read access
- ✅ Creates policies for authenticated users to upload their own avatars
- ✅ Creates policies for users to update/delete their own avatars
- ✅ Verifies the setup with select queries

## How to Use

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Open `setup-storage-bucket-fixed.sql`
4. Copy and paste the entire script into the SQL Editor
5. Click **Run** to execute

## Expected Output

You should see two result tables:

**Table 1: Bucket Status**
```
status: ✅ Storage bucket setup complete!
bucket_name: avatars
is_public: true
```

**Table 2: Policies Status**
```
status: ✅ Policies created successfully!
policy_name: Public Avatar Access
is_permissive: true

status: ✅ Policies created successfully!
policy_name: User Avatar Upload
is_permissive: true

status: ✅ Policies created successfully!
policy_name: User Avatar Update
is_permissive: true

status: ✅ Policies created successfully!
policy_name: User Avatar Delete
is_permissive: true
```

## Verification

After running the script, you can verify storage is working:

1. Check the Storage tab in Supabase dashboard
2. You should see the `avatars` bucket
3. The bucket should be marked as public
4. The policies should be visible in the storage bucket settings

## Common Issues

If you still encounter issues:

1. **Bucket already exists with different settings**: The `ON CONFLICT DO NOTHING` will skip creation, but you may need to manually check the bucket settings in the dashboard.

2. **Policies already exist**: `CREATE POLICY IF NOT EXISTS` will skip them, which is fine.

3. **Storage not working in app**: Check your Supabase client configuration in `.env` and ensure the storage URL is correct.