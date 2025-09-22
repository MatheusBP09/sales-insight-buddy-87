import { useState } from "react"
import { NavLink, useLocation } from "react-router-dom"
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  Building2, 
  BookOpen, 
  BarChart3,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/hooks/useAuth"
import { supabase } from "@/integrations/supabase/client"

const menuItems = [
  { 
    title: "Dashboard", 
    url: "/", 
    icon: LayoutDashboard,
    description: "Visão geral e KPIs" 
  },
  { 
    title: "Reuniões", 
    url: "/meetings", 
    icon: Calendar,
    description: "Lista e análises das reuniões" 
  },
  { 
    title: "Usuários", 
    url: "/users", 
    icon: Users,
    description: "Gestão de usuários e Business Units" 
  },
  { 
    title: "Financeiro", 
    url: "/financial", 
    icon: Building2,
    description: "Wealth, Crédito, Hedge" 
  },
  { 
    title: "Playbook", 
    url: "/playbook", 
    icon: BookOpen,
    description: "Regras e configurações de Relatórios" 
  },
  { 
    title: "Relatórios", 
    url: "/reports", 
    icon: BarChart3,
    description: "Dashboards e métricas" 
  }
]

export function AppSidebar() {
  const { open, setOpen, isMobile, openMobile, setOpenMobile } = useSidebar()
  const collapsed = !open
  const location = useLocation()
  const { user } = useAuth()
  const currentPath = location.pathname

  const isActive = (path: string) => currentPath === path
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
      isActive 
        ? "bg-primary/10 text-primary border border-primary/20" 
        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
    }`

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <Sidebar
      className={`border-r transition-all duration-300 ${collapsed ? "w-16" : "w-64"}`}
      collapsible="icon"
    >
      <SidebarHeader className="border-b p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold">
            AR
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-semibold">Analisador</span>
              <span className="text-xs text-muted-foreground">Reuniões</span>
            </div>
          )}
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          className={`ml-auto ${collapsed ? "w-8 h-8 p-0" : ""}`}
          onClick={() => setOpen(!open)}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </SidebarHeader>

      <SidebarContent className="p-4">
        <SidebarGroup>
          <SidebarGroupLabel className={collapsed ? "sr-only" : ""}>
            Navegação Principal
          </SidebarGroupLabel>
          
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={collapsed ? item.title : undefined}>
                    <NavLink 
                      to={item.url} 
                      className={getNavCls}
                      title={collapsed ? `${item.title} - ${item.description}` : undefined}
                    >
                      <item.icon className="h-4 w-4" />
                      {!collapsed && (
                        <div className="flex flex-col">
                          <span>{item.title}</span>
                          <span className="text-xs text-muted-foreground font-normal">
                            {item.description}
                          </span>
                        </div>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {!collapsed && (
          <SidebarGroup className="mt-8">
            <SidebarGroupLabel>Configurações</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink to="/settings" className={getNavCls}>
                      <Settings className="h-4 w-4" />
                      <span>Configurações</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user?.user_metadata?.avatar_url} />
            <AvatarFallback>
              {user?.email?.charAt(0).toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          
          {!collapsed && (
            <div className="flex flex-1 flex-col text-sm">
              <span className="font-medium">
                {user?.user_metadata?.full_name || user?.email?.split('@')[0]}
              </span>
              <span className="text-xs text-muted-foreground truncate">
                {user?.email}
              </span>
            </div>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className={collapsed ? "w-8 h-8 p-0" : ""}
            title="Sair"
          >
            <LogOut className="h-4 w-4" />
            {!collapsed && <span className="ml-2">Sair</span>}
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}