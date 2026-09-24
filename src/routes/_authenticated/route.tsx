import { createFileRoute, Outlet, useNavigate, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { useAuth } from "@/hooks/use-auth";
import { useProfile, initials } from "@/hooks/use-profile";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

export const Route = createFileRoute("/_authenticated")({
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login", replace: true });
  }, [user, loading, navigate]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Carregando...
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center gap-2 border-b bg-card px-4 sticky top-0 z-30">
            <SidebarTrigger />
            <div className="flex-1" />
            <HeaderAvatar />
          </header>
          <main className="flex-1 p-4 md:p-6 overflow-x-hidden">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function HeaderAvatar() {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  return (
    <Link to="/configuracoes" className="flex items-center gap-2 hover:opacity-80 transition">
      <span className="hidden sm:inline text-sm text-muted-foreground truncate max-w-[140px]">
        {profile?.nome || user?.email}
      </span>
      <Avatar className="h-8 w-8">
        {profile?.avatar_url && <AvatarImage src={profile.avatar_url} alt={profile?.nome || ""} />}
        <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
          {initials(profile?.nome, user?.email)}
        </AvatarFallback>
      </Avatar>
    </Link>
  );
}
