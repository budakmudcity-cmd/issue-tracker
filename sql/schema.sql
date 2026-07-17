-- ============================================================
-- PROJECT MANAGEMENT SYSTEM - COMPLETE DATABASE SCHEMA
-- ============================================================

create extension if not exists "uuid-ossp" schema public;

-- 1. PROFILES
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  name        text not null default '',
  role        text not null default 'user' check (role in ('admin', 'user')),
  created_at  timestamptz default now()
);
alter table public.profiles enable row level security;

-- 2. COMPANIES
create table public.companies (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null unique,
  created_at  timestamptz default now()
);
alter table public.companies enable row level security;

-- 3. PROJECTS
create table public.projects (
  id          uuid primary key default uuid_generate_v4(),
  company_id  uuid not null references public.companies(id) on delete cascade,
  name        text not null,
  created_at  timestamptz default now(),
  unique(company_id, name)
);
alter table public.projects enable row level security;

-- 4. PROJECT USERS
create table public.project_users (
  id          uuid primary key default uuid_generate_v4(),
  project_id  uuid not null references public.projects(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  created_at  timestamptz default now(),
  unique(project_id, user_id)
);
alter table public.project_users enable row level security;

-- 5. ISSUES
create table public.issues (
  id            uuid primary key default uuid_generate_v4(),
  project_id    uuid not null references public.projects(id) on delete cascade,
  module        text not null default '',
  description   text not null,
  type          text not null default 'Task' check (type in ('Bug', 'Enhancement', 'Feature Request', 'Task')),
  priority      text not null default 'Medium' check (priority in ('Low', 'Medium', 'High', 'Critical')),
  status        text not null default 'Open' check (status in ('Open', 'In Progress', 'Pending', 'Testing', 'Closed')),
  issue_by      text not null default '',
  issue_date    date default current_date,
  base          text not null default '',
  verified      boolean default false,
  verified_by   text not null default '',
  created_at    timestamptz default now()
);
alter table public.issues enable row level security;

-- 6. ISSUE REMARKS
create table public.issue_remarks (
  id          uuid primary key default uuid_generate_v4(),
  issue_id    uuid not null references public.issues(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  message     text not null,
  created_at  timestamptz default now()
);
alter table public.issue_remarks enable row level security;

-- INDEXES
create index idx_profiles_role on public.profiles(role);
create index idx_projects_company on public.projects(company_id);
create index idx_project_users_user on public.project_users(user_id);
create index idx_project_users_project on public.project_users(project_id);
create index idx_issues_project on public.issues(project_id);
create index idx_issues_status on public.issues(status);
create index idx_issues_priority on public.issues(priority);
create index idx_issue_remarks_issue on public.issue_remarks(issue_id);
create index idx_issue_remarks_created on public.issue_remarks(issue_id, created_at desc);

-- RLS POLICIES

-- PROFILES
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Admins can view all profiles"
  on public.profiles for select
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

create policy "Admins can insert profiles"
  on public.profiles for insert
  with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

create policy "Admins can update profiles"
  on public.profiles for update
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

create policy "Admins can delete profiles"
  on public.profiles for delete
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- COMPANIES
create policy "Admins can all companies"
  on public.companies for all
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

create policy "Users can read companies"
  on public.companies for select
  using (true);

-- PROJECTS
create policy "Admins can all projects"
  on public.projects for all
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

create policy "Users can read assigned projects"
  on public.projects for select
  using (
    exists (select 1 from public.project_users where project_id = id and user_id = auth.uid())
    or
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- PROJECT USERS
create policy "Admins can all project_users"
  on public.project_users for all
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

create policy "Users can read own project_users"
  on public.project_users for select
  using (user_id = auth.uid());

-- ISSUES
create policy "Admins can all issues"
  on public.issues for all
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

create policy "Users can read issues in assigned projects"
  on public.issues for select
  using (
    exists (select 1 from public.project_users where project_id = issues.project_id and user_id = auth.uid())
    or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "Users can insert issues in assigned projects"
  on public.issues for insert
  with check (
    exists (select 1 from public.project_users where project_id = issues.project_id and user_id = auth.uid())
    or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "Users can update issues in assigned projects"
  on public.issues for update
  using (
    exists (select 1 from public.project_users where project_id = issues.project_id and user_id = auth.uid())
    or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "Only admins can delete issues"
  on public.issues for delete
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- ISSUE REMARKS
create policy "Admins can all remarks"
  on public.issue_remarks for all
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

create policy "Users can read remarks in assigned projects"
  on public.issue_remarks for select
  using (
    exists (select 1 from public.issues i
      join public.project_users pu on pu.project_id = i.project_id
      where i.id = issue_remarks.issue_id and pu.user_id = auth.uid())
    or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "Users can insert remarks in assigned projects"
  on public.issue_remarks for insert
  with check (
    exists (select 1 from public.issues i
      join public.project_users pu on pu.project_id = i.project_id
      where i.id = issue_remarks.issue_id and pu.user_id = auth.uid())
    or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );
