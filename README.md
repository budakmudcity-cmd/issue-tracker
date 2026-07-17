# Project Management System

A modern issue tracking and project management system built with Next.js 15, Supabase, and Tailwind CSS.

## Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Supabase (PostgreSQL, Auth, RLS)
- **Charts**: Recharts
- **Tables**: TanStack Table
- **Forms**: React Hook Form (pattern ready), Zod (validation ready)
- **Deployment**: Vercel

## Features

- Multi-company, multi-project hierarchy
- Role-based access (Admin / User)
- Issue tracking with status, priority, type
- Remark timeline per issue (like GitHub comments)
- Admin dashboard with charts
- User dashboard scoped to assigned projects
- Company/Project selector in navbar
- Dark mode support
- Responsive design
- CSV export
- Row Level Security (RLS)

## Project Structure

```
pms/
├── app/
│   ├── auth/login/          # Login page
│   ├── (dashboard)/         # Protected routes
│   │   ├── dashboard/       # User dashboard
│   │   ├── admin/
│   │   │   ├── dashboard/   # Admin dashboard
│   │   │   └── settings/    # Admin settings (CRUD)
│   │   └── projects/
│   │       └── [projectId]/
│   │           ├── page.tsx           # Issue list (TanStack Table)
│   │           └── issues/
│   │               ├── [issueId]/     # Issue detail + remarks
│   │               ├── new/           # Create issue
│   │               └── [issueId]/edit/# Edit issue
├── components/
│   ├── ui/                 # shadcn/ui components
│   ├── layout/             # Sidebar, Navbar, AppLayout
│   ├── issues/             # IssueForm
│   └── dashboard/          # AdminCharts
├── lib/
│   ├── supabase/
│   │   ├── client.ts       # Browser client
│   │   ├── server.ts       # Server client + admin client
│   │   └── middleware.ts   # Auth middleware
│   ├── utils.ts            # cn(), formatDate()
│   └── constants.ts        # Statuses, priorities, colors
├── providers/
│   ├── auth-provider.tsx   # Auth context
│   ├── company-provider.tsx# Company context
│   ├── project-provider.tsx# Project context
│   └── theme-provider.tsx  # Dark mode
├── hooks/
│   ├── use-issues.ts
│   └── use-remarks.ts
├── types/
│   └── index.ts            # All TypeScript interfaces
├── sql/
│   ├── schema.sql          # Full DB schema + RLS
│   └── seed.sql            # Seed data
├── middleware.ts           # Route protection
└── vercel.json             # Vercel config
```

## A-Z Setup Guide

### Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/log in
2. Click **New Project**
3. Fill in:
   - **Name**: `pms` (or any name)
   - **Database Password**: Generate a strong password and save it
   - **Region**: Choose closest to you
4. Wait ~2 minutes for provisioning

### Step 2: Get API Keys

1. In your Supabase dashboard, go to **Project Settings > API**
2. Copy the following:
   - **Project URL** (looks like `https://xxxxxxx.supabase.co`)
   - **anon public key** (starts with `eyJ...`)
   - **service_role key** (starts with `eyJ...`) — click "Reveal" if hidden

### Step 3: Configure Environment Variables

1. Rename `.env.local` to `.env.local` (it already exists)
2. Fill in your values:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### Step 4: Run Database Schema

1. In Supabase dashboard, go to **SQL Editor**
2. Click **New Query**
3. Open `sql/schema.sql` from this project and paste the entire contents
4. Click **Run**
5. All tables, indexes, and RLS policies will be created

### Step 5: Create Admin User

1. In Supabase dashboard, go to **Authentication > Users**
2. Click **Add User**
3. Create a user with:
   - **Email**: `admin@example.com`
   - **Password**: Choose a strong password
4. Click **Create**

5. Go to **SQL Editor** and run this to make the user an admin:
```sql
insert into public.profiles (id, email, name, role)
select id, email, 'Admin', 'admin'
from auth.users
where email = 'admin@example.com'
on conflict (id) do update set role = 'admin';
```

### Step 6: Create Regular User (Optional)

1. Create another user in **Authentication > Users**
2. Run:
```sql
insert into public.profiles (id, email, name, role)
select id, email, 'User', 'user'
from auth.users
where email = 'user@example.com'
on conflict (id) do nothing;
```

### Step 7: Seed Companies & Projects

1. In **SQL Editor**, open and run `sql/seed.sql`
2. This creates:
   - Companies: WASSB, WAVI
   - Projects under WASSB: ATP, EPROCUREMENT, LOTUS, SEALION
   - Projects under WAVI: ERP, FINANCE, HRMS

### Step 8: Assign Users to Projects

Run this SQL to assign admin to all projects:
```sql
insert into public.project_users (project_id, user_id)
select p.id, pr.id
from public.projects p
cross join public.profiles pr
where pr.email = 'admin@example.com'
on conflict do nothing;
```

For regular users, assign only specific projects:
```sql
insert into public.project_users (project_id, user_id)
select p.id, pr.id
from public.projects p
cross join public.profiles pr
where pr.email = 'user@example.com'
  and p.name in ('ATP', 'ERP')
on conflict do nothing;
```

### Step 9: Run Locally

```bash
# Install dependencies
npm install

# Start dev server
npm run dev
```

Visit `http://localhost:3000` and sign in with `admin@example.com`.

### Step 10: Deploy to Vercel

1. Push code to GitHub:
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/pms.git
git push -u origin main
```

2. Go to [vercel.com](https://vercel.com) and import the GitHub repository

3. In **Environment Variables**, add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

4. Click **Deploy**

5. Once deployed, update your Supabase project's **Authentication > Settings**:
   - Add your Vercel URL to **Site URL** (e.g., `https://pms.vercel.app`)

## User Roles

### Admin
- Full access to all companies, projects, issues
- Create/edit/delete companies
- Create/edit/delete projects
- Create/edit/delete users
- Assign users to projects
- View admin dashboard with global statistics

### User
- Only sees projects they are assigned to
- Create and edit issues within assigned projects
- Cannot delete issues
- Cannot access admin dashboard or settings
- Can add remarks to issues

## API Endpoints

The app uses Supabase directly from the client with RLS. No custom API routes needed:
- `supabase.from('issues').select(...)` — list issues
- `supabase.from('issues').insert(...)` — create issue
- `supabase.from('issues').update(...)` — update issue
- `supabase.from('issues').delete(...)` — delete issue (admin only)
- `supabase.from('issue_remarks').insert(...)` — add remark

## Database Tables

| Table | Description |
|-------|-------------|
| profiles | User profiles (extends auth.users) |
| companies | Organizations |
| projects | Projects under companies |
| project_users | User-project assignments |
| issues | Issue tracker entries |
| issue_remarks | Timeline comments per issue |

## Environment Variables

| Variable | Description |
|----------|-------------|
| NEXT_PUBLIC_SUPABASE_URL | Supabase project URL |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Supabase anon/public key |
| SUPABASE_SERVICE_ROLE_KEY | Supabase service role key (admin operations) |
