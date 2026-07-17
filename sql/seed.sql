-- ============================================================
-- SEED DATA
-- ============================================================

-- 1. COMPANIES
insert into public.companies (name) values
  ('WASSB'),
  ('WAVI');

-- 2. PROJECTS (WASSB)
insert into public.projects (company_id, name)
select c.id, p.name
from (values
  ('WASSB', 'ATP'),
  ('WASSB', 'EPROCUREMENT'),
  ('WASSB', 'LOTUS'),
  ('WASSB', 'SEALION')
) as p(company_name, name)
join public.companies c on c.name = p.company_name;

-- 3. PROJECTS (WAVI)
insert into public.projects (company_id, name)
select c.id, p.name
from (values
  ('WAVI', 'ERP'),
  ('WAVI', 'FINANCE'),
  ('WAVI', 'HRMS')
) as p(company_name, name)
join public.companies c on c.name = p.company_name;

-- 4. SAMPLE ISSUES (uncomment and adjust user/project IDs after setup)
-- insert into public.issues (project_id, module, description, type, priority, status, issue_by, issue_date) values
--   ((select id from public.projects where name = 'ATP' limit 1), 'Dashboard', 'Fix loading spinner', 'Bug', 'High', 'Open', 'Admin', current_date),
--   ((select id from public.projects where name = 'ERP' limit 1), 'Login', 'Add SSO support', 'Feature Request', 'Medium', 'In Progress', 'Admin', current_date);
