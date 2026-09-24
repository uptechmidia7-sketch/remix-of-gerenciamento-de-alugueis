import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  Building2, LayoutDashboard, Home, Users, Receipt, Wallet,
  BarChart3, Settings, LogOut,
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarHeader, SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/use-auth";
import { useProfile, initials } from "@/hooks/use-profile";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

const items = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Imóveis", url: "/imoveis", icon: Home },
  { title: "Inquilinos", url: "/inquilinos", icon: Users },
  { title: "Pagamentos", url: "/pagamentos", icon: Receipt },
  { title: "Despesas", url: "/despesas", icon: Wallet },
  { title: "Relatórios", url: "/relatorios", icon: BarChart3 },
  { title: "Configurações", url: "/configuracoes", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const path = useRouterState({ select: (r) => r.location.pathname });
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2 px-2 py-2">
          <div className="w-9 h-9 rounded-lg bg-sidebar-primary flex items-center justify-center text-sidebar-primary-foreground shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-semibold text-sidebar-foreground text-sm">Gestão</span>
              <span className="text-xs text-sidebar-foreground/60">de Aluguéis</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const active = path === item.url || path.startsWith(item.url + "/");
                return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton asChild isActive={active} tooltip={item.title}>
                      <Link to={item.url} className="flex items-center gap-2">
                        <item.icon className="w-4 h-4" />
                        {!collapsed && <span>{item.title}</span>}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <ProfileBlock collapsed={collapsed} />
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={async () => { await signOut(); navigate({ to: "/login" }); }}
              tooltip="Sair"
            >
              <LogOut className="w-4 h-4" />
              {!collapsed && <span>Sair</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

function ProfileBlock({ collapsed }: { collapsed: boolean }) {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const name = profile?.nome || user?.email || "";
  return (
    <div className="flex items-center gap-2 px-2 py-2">
      <Avatar className="h-8 w-8 shrink-0">
        {profile?.avatar_url && <AvatarImage src={profile.avatar_url} alt={name} />}
        <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-xs font-semibold">
          {initials(profile?.nome, user?.email)}
        </AvatarFallback>
      </Avatar>
      {!collapsed && (
        <div className="flex flex-col min-w-0">
          <span className="text-xs font-medium text-sidebar-foreground truncate">{profile?.nome || "Usuário"}</span>
          <span className="text-[10px] text-sidebar-foreground/60 truncate">{user?.email}</span>
        </div>
      )}
    </div>
  );
}

