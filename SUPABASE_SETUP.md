# Supabase Setup Guide for Setlist

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Fill in your project details
5. Wait for the project to be created

## 2. Get Your API Keys

1. In your Supabase project dashboard, go to **Settings** → **API**
2. Copy your **Project URL** (e.g., `https://xxxxx.supabase.co`)
3. Copy your **anon/public key** (starts with `eyJ...`)

## 3. Add Environment Variables

Add these to your `.env` file in the project root:

```
REACT_APP_SUPABASE_URL=https://xxxxx.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJ...
```

Replace with your actual values from step 2.

## 4. Set Up the Database

1. In your Supabase dashboard, go to **SQL Editor**
2. Open the `supabase-setup.sql` file from this project
3. Copy and paste the entire SQL into the SQL Editor
4. Click **Run** to execute

This will create:
- `songs` table with all necessary columns
- Indexes for performance
- Row Level Security policies (currently set to public access)
- Auto-update trigger for `updated_at` timestamp

### 4a. Add Notes/Chat Feature (Optional)

1. In your Supabase dashboard, go to **SQL Editor**
2. Open the `supabase-notes-migration.sql` file from this project
3. Copy and paste the entire SQL into the SQL Editor
4. Click **Run** to execute

This will create:
- `notes` table for chat messages
- Indexes for faster message queries
- Row Level Security policies (currently set to public access)
- Support for 3 users: Collin, Leif, Ryland

## 5. Test the Integration

1. Restart your dev server to pick up the new env variables
2. Navigate to `/setlist` and enter the password
3. After entering the password, you'll be asked to select your identity (Collin, Leif, or Ryland)
4. Toggle the **DB/Local** switch in the top right
5. When toggled to **DB**, it will load from Supabase
6. When toggled to **Local**, it uses localStorage (default)
7. Scroll to the bottom to see the Notes/Chat section where you can discuss the setlist

## 6. Security (Optional)

If you want to restrict database access:

1. Go to **Authentication** → **Policies** in Supabase
2. Modify the RLS policies in the SQL editor
3. Change from public access to authenticated users only
4. Implement Supabase Auth in your app

## Current Setup

- **Public Access**: Anyone with the password can read/write
- **No Authentication Required**: Works with just the password gate
- **Multi-user**: Multiple people can edit simultaneously
- **Real-time**: Changes sync across all users (notes use real-time subscriptions)
- **Notes/Chat**: Live chat feature at the bottom of the setlist page for discussing songs

## Troubleshooting

- **"Failed to load from database"**: Check your env variables are set correctly
- **"Failed to save"**: Verify RLS policies allow public access (or implement auth)
- **Empty setlist**: Make sure you've run the SQL setup script

