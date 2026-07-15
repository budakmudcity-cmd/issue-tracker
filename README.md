# Issue Tracker

Simple issue tracking system built with **HTML + CSS + JavaScript + PHP**, using **Supabase** as the database, hosted on **Vercel**.

## Architecture

```
Browser (HTML/CSS/JS)  -->  Vercel (PHP Serverless)  -->  Supabase (PostgreSQL)
```

- Frontend: Vanilla HTML, CSS, JavaScript
- Backend: PHP (serverless on Vercel via `vercel-php`)
- Database: Supabase (PostgreSQL)
- Auth: Custom JWT tokens (PHP-generated)

---

## A-Z Deployment Guide

### Step 1: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/log in
2. Click **New Project**
3. Fill in:
   - **Name**: `issue-tracker`
   - **Database Password**: generate a strong one, save it "k7MN7jQXlQdKpgxO"
   - **Region**: choose the closest to you
4. Wait ~2 minutes for the database to provision
5. Once ready, go to **Project Settings > API** and copy: "sb_publishable_Gra7xB2qAFCX3JN93H90sQ_UF9INVBq"
   - **Project URL** (looks like `https://xxxxxxx.supabase.co`)
   - **anon public key** (starts with `eyJ...`)

### Step 2: Set Up Database Tables

1. In your Supabase dashboard, go to **SQL Editor**
2. Click **New Query** and paste the following:

```sql
-- Create users table
CREATE TABLE users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create issues table
CREATE TABLE issues (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    created_by TEXT NOT NULL,
    assigned_to TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Allow public access (PHP backend handles auth)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE issues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on users" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on issues" ON issues FOR ALL USING (true) WITH CHECK (true);
```

3. Click **Run** to execute

### Step 3: Seed the Admin User

1. In the SQL Editor, run this query to create the admin user with a bcrypt hash:

```sql
-- Password: pass$123 (bcrypt hash)
INSERT INTO users (username, password_hash)
VALUES ('admin', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi')
ON CONFLICT (username) DO NOTHING;
```

> **Note**: The hash above is a placeholder. You can also seed via the API after deployment (see Step 9).

2. Verify by running: `SELECT * FROM users;` — you should see the admin user.

### Step 4: Push Code to GitHub

1. Create a new repository on GitHub (do NOT initialize with README)
2. In your terminal, run:

```bash
cd issue-tracker
git init
git add .
git commit -m "Initial commit: issue tracker"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/issue-tracker.git
git push -u origin main
```

### Step 5: Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) and log in (sign up with GitHub)
2. Click **Add New > Project**
3. Import the `issue-tracker` repository from GitHub
4. In the **Configure Project** screen:

   **Framework Preset**: Leave as `Other`

   **Root Directory**: `./` (default)

   **Build & Output Settings**: Leave defaults

5. Under **Environment Variables**, add these three (use the values from Step 1):

| Name | Value |
|------|-------|
| `SUPABASE_URL` | `https://xxxxxxx.supabase.co` |
| `SUPABASE_KEY` | `eyJ...` (your anon public key) |
| `JWT_SECRET` | Generate a random secret string (e.g., `openssl rand -hex 32` or just type a long random string) |

6. Click **Deploy**
7. Wait ~1 minute for the deployment to complete
8. Vercel will give you a URL like `https://issue-tracker.vercel.app`

### Step 6: Seed Admin via API (Alternative)

If you skipped the SQL seed in Step 3, you can do it via the API:

1. Open your browser and visit:
   ```
   https://YOUR-VERCEL-URL.vercel.app/api/seed
   ```
2. You should see: `{"message":"Admin user created successfully"}`
3. After this, **delete or protect the seed endpoint** (or just leave it — it will return 409 on repeat calls)

### Step 7: Login

1. Visit your Vercel URL
2. Login with:
   - **Username**: `admin`
   - **Password**: `pass$123`
3. You're in! Start creating issues.

### Step 8: Custom Domain (Optional)

1. In Vercel project dashboard, go to **Settings > Domains**
2. Add your domain and follow Vercel's DNS instructions

### Step 9: Local Development

To run locally with PHP:

1. Copy `.env.example` to `.env` and fill in your Supabase credentials
2. Start PHP dev server:
   ```bash
   php -S localhost:8000
   ```
3. Visit `http://localhost:8000/login.html`

> Note: For local dev, the API paths point to `/api/...` which won't work without Vercel. You can use a tool like `vercel dev` or modify the paths.

---

## File Structure

```
issue-tracker/
├── api/
│   ├── config.php        # CORS, env vars, helpers, JWT
│   ├── login.php         # POST /api/login
│   ├── issues.php        # CRUD /api/issues
│   ├── users.php         # GET /api/users (for assignment)
│   └── seed.php          # One-time admin seed
├── css/
│   └── style.css         # All styles
├── js/
│   └── app.js            # Login + Dashboard logic
├── login.html            # Login page
├── dashboard.html        # Dashboard page
├── vercel.json           # Vercel PHP config
├── composer.json         # PHP deps (empty)
└── README.md
```

## Default Credentials

| Field | Value |
|-------|-------|
| Username | `admin` |
| Password | `pass$123` |

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML5, CSS3, Vanilla JS (ES6+) |
| Backend | PHP 8.x (serverless on Vercel) |
| Database | Supabase (PostgreSQL) |
| Auth | HMAC-SHA256 JWT tokens |
| Hosting | Vercel (via `vercel-php` runtime) |
| Version Control | GitHub |
