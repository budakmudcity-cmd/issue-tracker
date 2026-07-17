"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import type { Company, Project, Profile } from "@/types";

export default function SettingsPage() {
  const supabase = createClient();

  // Companies
  const [companies, setCompanies] = useState<Company[]>([]);
  const [companyName, setCompanyName] = useState("");
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [companyDialogOpen, setCompanyDialogOpen] = useState(false);

  // Projects
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectName, setProjectName] = useState("");
  const [projectCompanyId, setProjectCompanyId] = useState("");
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [projectDialogOpen, setProjectDialogOpen] = useState(false);

  // Users
  const [users, setUsers] = useState<Profile[]>([]);
  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState("");
  const [userPassword, setUserPassword] = useState("");
  const [userRole, setUserRole] = useState<"admin" | "user">("user");
  const [editingUser, setEditingUser] = useState<Profile | null>(null);
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [userProjects, setUserProjects] = useState<string[]>([]);

  const loadData = async () => {
    const { data: c } = await supabase.from("companies").select("*").order("name");
    setCompanies(c || []);
    const { data: p } = await supabase.from("projects").select("*, company:companies(name)").order("name");
    setProjects(p || []);
    const { data: u } = await supabase.from("profiles").select("*").order("name");
    setUsers(u || []);
  };

  useEffect(() => { loadData(); }, []);

  // Company CRUD
  const saveCompany = async () => {
    if (!companyName.trim()) return;
    if (editingCompany) {
      await supabase.from("companies").update({ name: companyName.trim() }).eq("id", editingCompany.id);
    } else {
      await supabase.from("companies").insert({ name: companyName.trim() });
    }
    toast.success(editingCompany ? "Company updated" : "Company created");
    setCompanyDialogOpen(false);
    setCompanyName("");
    setEditingCompany(null);
    loadData();
  };

  const deleteCompany = async (id: string) => {
    if (!confirm("Delete this company and all its projects?")) return;
    await supabase.from("companies").delete().eq("id", id);
    toast.success("Company deleted");
    loadData();
  };

  // Project CRUD
  const saveProject = async () => {
    if (!projectName.trim() || !projectCompanyId) return;
    if (editingProject) {
      await supabase.from("projects").update({ name: projectName.trim(), company_id: projectCompanyId }).eq("id", editingProject.id);
    } else {
      await supabase.from("projects").insert({ name: projectName.trim(), company_id: projectCompanyId });
    }
    toast.success(editingProject ? "Project updated" : "Project created");
    setProjectDialogOpen(false);
    setProjectName("");
    setProjectCompanyId("");
    setEditingProject(null);
    loadData();
  };

  const deleteProject = async (id: string) => {
    if (!confirm("Delete this project and all its issues?")) return;
    await supabase.from("projects").delete().eq("id", id);
    toast.success("Project deleted");
    loadData();
  };

  // User CRUD
  const saveUser = async () => {
    if (editingUser) {
      await supabase.from("profiles").update({ name: userName, role: userRole }).eq("id", editingUser.id);
      toast.success("User updated");
    } else {
      const { data: authUser, error } = await supabase.auth.admin.createUser({
        email: userEmail,
        password: userPassword,
        email_confirm: true,
      });
      if (error) { toast.error(error.message); return; }
      if (authUser?.user) {
        await supabase.from("profiles").insert({
          id: authUser.user.id,
          email: userEmail,
          name: userName,
          role: userRole,
        });
      }
      toast.success("User created");
    }
    setUserDialogOpen(false);
    setUserName("");
    setUserEmail("");
    setUserPassword("");
    setEditingUser(null);
    loadData();
  };

  const deleteUser = async (id: string) => {
    if (!confirm("Delete this user?")) return;
    await supabase.auth.admin.deleteUser(id);
    await supabase.from("profiles").delete().eq("id", id);
    toast.success("User deleted");
    loadData();
  };

  const assignProjects = async (userId: string) => {
    await supabase.from("project_users").delete().eq("user_id", userId);
    if (userProjects.length > 0) {
      await supabase.from("project_users").insert(userProjects.map((pid) => ({ project_id: pid, user_id: userId })));
    }
    toast.success("Projects assigned");
    setUserProjects([]);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage companies, projects, and users</p>
      </div>

      <Tabs defaultValue="companies">
        <TabsList>
          <TabsTrigger value="companies">Companies</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
        </TabsList>

        <TabsContent value="companies" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Companies</CardTitle>
              <Dialog open={companyDialogOpen && !editingCompany} onOpenChange={(o) => { setCompanyDialogOpen(o); if (!o) { setCompanyName(""); setEditingCompany(null); } }}>
                <DialogTrigger asChild>
                  <Button size="sm"><Plus className="h-4 w-4 mr-1" />Add Company</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>New Company</DialogTitle></DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Company Name</Label>
                      <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
                    </div>
                    <Button onClick={saveCompany}>Save</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {companies.map((c) => (
                  <div key={c.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50">
                    <span className="font-medium">{c.name}</span>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" onClick={() => { setEditingCompany(c); setCompanyName(c.name); setCompanyDialogOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteCompany(c.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="projects" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Projects</CardTitle>
              <Dialog open={projectDialogOpen && !editingProject} onOpenChange={(o) => { setProjectDialogOpen(o); if (!o) { setProjectName(""); setProjectCompanyId(""); setEditingProject(null); } }}>
                <DialogTrigger asChild>
                  <Button size="sm"><Plus className="h-4 w-4 mr-1" />Add Project</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>New Project</DialogTitle></DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Company</Label>
                      <Select value={projectCompanyId} onValueChange={setProjectCompanyId}>
                        <SelectTrigger><SelectValue placeholder="Select company" /></SelectTrigger>
                        <SelectContent>{companies.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Project Name</Label>
                      <Input value={projectName} onChange={(e) => setProjectName(e.target.value)} />
                    </div>
                    <Button onClick={saveProject}>Save</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {projects.map((p) => (
                  <div key={p.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50">
                    <div>
                      <span className="font-medium">{p.name}</span>
                      <span className="text-sm text-muted-foreground ml-2">{(p as any).company?.name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" onClick={() => { setEditingProject(p); setProjectName(p.name); setProjectCompanyId(p.company_id); setProjectDialogOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteProject(p.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Users</CardTitle>
              <Dialog open={userDialogOpen} onOpenChange={(o) => { setUserDialogOpen(o); if (!o) { setUserName(""); setUserEmail(""); setUserPassword(""); setUserRole("user"); setEditingUser(null); } }}>
                <DialogTrigger asChild>
                  <Button size="sm"><UserPlus className="h-4 w-4 mr-1" />Add User</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>{editingUser ? "Edit User" : "New User"}</DialogTitle></DialogHeader>
                  <div className="space-y-4">
                    {!editingUser && (
                      <div>
                        <Label>Email</Label>
                        <Input type="email" value={userEmail} onChange={(e) => setUserEmail(e.target.value)} />
                      </div>
                    )}
                    <div>
                      <Label>Name</Label>
                      <Input value={userName} onChange={(e) => setUserName(e.target.value)} />
                    </div>
                    {!editingUser && (
                      <div>
                        <Label>Password</Label>
                        <Input type="password" value={userPassword} onChange={(e) => setUserPassword(e.target.value)} />
                      </div>
                    )}
                    <div>
                      <Label>Role</Label>
                      <Select value={userRole} onValueChange={(v: "admin" | "user") => setUserRole(v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">User</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button onClick={saveUser}>{editingUser ? "Update" : "Create"}</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {users.map((u) => (
                  <div key={u.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50">
                    <div>
                      <span className="font-medium">{u.name || "No name"}</span>
                      <span className="text-sm text-muted-foreground ml-2">{u.email}</span>
                      <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${u.role === "admin" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"}`}>{u.role}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" onClick={async () => {
                        setEditingUser(u);
                        setUserName(u.name);
                        setUserRole(u.role);
                        setUserDialogOpen(true);
                        const { data: pu } = await supabase.from("project_users").select("project_id").eq("user_id", u.id);
                        setUserProjects(pu?.map((p) => p.project_id) || []);
                      }}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteUser(u.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
