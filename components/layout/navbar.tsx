"use client";

import { useAuth } from "@/providers/auth-provider";
import { useCompany } from "@/providers/company-provider";
import { useProject } from "@/providers/project-provider";
import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Menu, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { createClient } from "@/lib/supabase/client";
import { useEffect } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Navbar() {
  const { profile } = useAuth();
  const { companies, selectedCompany, setSelectedCompany, refresh: refreshCompanies } = useCompany();
  const { projects, selectedProject, setSelectedProject, refresh: refreshProjects } = useProject();
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => { refreshCompanies(); }, [refreshCompanies]);
  useEffect(() => { if (selectedCompany) refreshProjects(); }, [selectedCompany, refreshProjects]);

  const handleCompanyChange = (id: string) => {
    const company = companies.find((c) => c.id === id) || null;
    setSelectedCompany(company);
    setSelectedProject(null);
  };

  const handleProjectChange = (id: string) => {
    const project = projects.find((p) => p.id === id) || null;
    setSelectedProject(project);
    if (project) router.push(`/projects/${project.id}`);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  const initials = profile?.name?.charAt(0)?.toUpperCase() || profile?.email?.charAt(0)?.toUpperCase() || "U";

  return (
    <header className="h-16 border-b bg-card flex items-center px-4 lg:px-6 sticky top-0 z-30">
      <Button variant="ghost" size="icon" className="lg:hidden mr-2">
        <Menu className="h-5 w-5" />
      </Button>
      <div className="flex items-center gap-4 flex-1">
        <Select value={selectedCompany?.id || ""} onValueChange={handleCompanyChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select company" />
          </SelectTrigger>
          <SelectContent>
            {companies.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedProject?.id || ""} onValueChange={handleProjectChange} disabled={!selectedCompany}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder={selectedCompany ? "Select project" : "Select company first"} />
          </SelectTrigger>
          <SelectContent>
            {projects.map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{profile?.name || "User"}</p>
                <p className="text-xs leading-none text-muted-foreground">{profile?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs text-muted-foreground">Role: {profile?.role}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>Log out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
