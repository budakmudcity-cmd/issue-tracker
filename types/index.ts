export type Role = "admin" | "user";

export interface Profile {
  id: string;
  email: string;
  name: string;
  role: Role;
  created_at?: string;
}

export interface Company {
  id: string;
  name: string;
  created_at?: string;
}

export interface Project {
  id: string;
  company_id: string;
  name: string;
  company?: Company;
  created_at?: string;
}

export interface ProjectUser {
  id: string;
  project_id: string;
  user_id: string;
  profiles?: Profile;
}

export type IssueStatus = "Open" | "In Progress" | "Pending" | "Testing" | "Closed";
export type IssuePriority = "Low" | "Medium" | "High" | "Critical";
export type IssueType = "Bug" | "Enhancement" | "Feature Request" | "Task";

export interface Issue {
  id: string;
  project_id: string;
  module: string;
  description: string;
  type: IssueType;
  priority: IssuePriority;
  status: IssueStatus;
  issue_by: string;
  issue_date: string;
  base: string;
  verified: boolean;
  verified_by: string;
  created_at?: string;
  project?: Project;
}

export interface IssueRemark {
  id: string;
  issue_id: string;
  user_id: string;
  message: string;
  created_at: string;
  profiles?: Profile;
}

export interface DashboardStats {
  totalIssues: number;
  openIssues: number;
  inProgressIssues: number;
  closedIssues: number;
  highPriorityIssues: number;
  totalCompanies?: number;
  totalProjects?: number;
}
