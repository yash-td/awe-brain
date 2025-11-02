# Supabase Migration Guide

This guide will help you migrate from the ngrok local server to Supabase for storing conversations and chat data.

## Prerequisites

- Supabase account (already created)
- Project ID: `waipfnhhizeywmnoeliq`
- Supabase URL: `https://waipfnhhizeywmnoeliq.supabase.co`

## Step 1: Set Up Supabase Tables

1. Go to your Supabase project dashboard: https://supabase.com/dashboard/project/waipfnhhizeywmnoeliq

2. Navigate to the **SQL Editor** in the left sidebar

3. Copy the contents of `supabase-migration.sql` from the root of this project

4. Paste the SQL into the SQL Editor and click **Run**

5. Verify that all tables were created successfully:
   - `users`
   - `folders`
   - `conversations`
   - `messages`
   - `file_attachments`
   - `documents`

## Step 2: Verify Environment Variables

Your environment variables have been updated in:
- `.env` (for local development)
- `.env.production` (for Netlify deployment)

Make sure your `.env` file contains:
```env
VITE_SUPABASE_URL=https://waipfnhhizeywmnoeliq.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndhaXBmbmhoaXpleXdtbm9lbGlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3ODU2OTMsImV4cCI6MjA3NTM2MTY5M30.R0fL4LOo073XiaUvUwU7lTo2HS4qgFFcmgQEKAohm2Y
```

## Step 3: Update Netlify Environment Variables

If you're deploying to Netlify, add the Supabase environment variables:

1. Go to your Netlify site dashboard
2. Navigate to **Site settings** → **Environment variables**
3. Add the following variables:
   - `VITE_SUPABASE_URL` = `https://waipfnhhizeywmnoeliq.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndhaXBmbmhoaXpleXdtbm9lbGlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3ODU2OTMsImV4cCI6MjA3NTM2MTY5M30.R0fL4LOo073XiaUvUwU7lTo2HS4qgFFcmgQEKAohm2Y`

## Step 4: Test the Migration

1. Install dependencies (if you haven't already):
   ```bash
   cd movar-brain
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open your browser and test the following features:
   - User authentication (sign in/sign up)
   - Create a new folder
   - Create a new conversation
   - Send messages
   - Upload files
   - View conversation history

4. Check the browser console for any errors. You should see:
   - "Supabase configured"
   - "Initializing Supabase for user: [user-id]"
   - "Supabase is connected"

## Step 5: Verify Data in Supabase

1. Go to your Supabase project dashboard
2. Navigate to **Table Editor** in the left sidebar
3. Check that data is being saved to the tables:
   - Click on each table (`users`, `folders`, `conversations`, `messages`)
   - Verify that your test data appears

## What Changed?

### Removed
- ❌ Local SQLite database (`server/movar-brain.db`)
- ❌ Express server (`server/server.js`, `server/database.js`)
- ❌ ngrok tunnel requirement
- ❌ `VITE_LOCAL_API_URL` environment variable

### Added
- ✅ Supabase PostgreSQL database (cloud-hosted)
- ✅ `supabaseService.ts` - Direct Supabase client integration
- ✅ `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` environment variables
- ✅ Automatic table creation with migrations
- ✅ Row Level Security (RLS) policies for data protection

### Benefits
- 🌐 No need to run local server or ngrok
- ☁️ Cloud-hosted database accessible from anywhere
- 🔒 Built-in security with Row Level Security
- 📈 Scalable infrastructure
- 💰 Free tier includes 500MB database + 1GB file storage
- 🚀 Faster deployment (no server setup needed)

## Troubleshooting

### Error: "Supabase not configured"
- Make sure your `.env` file exists and contains the correct Supabase credentials
- Restart your development server after adding environment variables

### Error: "relation 'users' does not exist"
- You haven't run the SQL migration script
- Go to Supabase SQL Editor and run `supabase-migration.sql`

### Data not showing up
- Check browser console for errors
- Verify that you're signed in with Clerk authentication
- Check Supabase Table Editor to see if data is being saved

### RLS Policy Errors
- The migration script includes RLS policies that allow all authenticated operations
- If you want to restrict access, update the policies in the Supabase dashboard

## Migrating Existing Data (Optional)

If you have existing data in the SQLite database that you want to migrate:

1. Export data from SQLite:
   ```bash
   cd server
   sqlite3 movar-brain.db .dump > data_export.sql
   ```

2. Convert SQLite SQL to PostgreSQL format (this requires manual editing):
   - Change `AUTOINCREMENT` to `SERIAL`
   - Change `TEXT` PRIMARY KEYs to `UUID`
   - Update date/time formats

3. Import into Supabase using the SQL Editor

**Note:** Given the schema changes (TEXT IDs → UUIDs), manual data migration can be complex. If you have critical data, consider writing a custom migration script.

## Next Steps

Now that you've migrated to Supabase:

1. ✅ You can stop running the ngrok server
2. ✅ You can delete the `server/` directory if you want
3. ✅ Your app will work from any deployment (Netlify, Vercel, etc.)
4. ✅ Deploy to Netlify without worrying about backend infrastructure

## Support

If you encounter any issues:
- Check the Supabase documentation: https://supabase.com/docs
- Review the table schema in `supabase-migration.sql`
- Check the browser console for detailed error messages
- Verify your environment variables are correctly set
