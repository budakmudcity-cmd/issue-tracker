import { AuthProvider } from "@/providers/auth-provider";
import { CompanyProvider } from "@/providers/company-provider";
import { ProjectProvider } from "@/providers/project-provider";
import { AppLayout } from "@/components/layout/app-layout";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <CompanyProvider>
        <ProjectProvider>
          <AppLayout>{children}</AppLayout>
        </ProjectProvider>
      </CompanyProvider>
    </AuthProvider>
  );
}
