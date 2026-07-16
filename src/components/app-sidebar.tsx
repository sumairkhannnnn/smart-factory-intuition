import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  LayoutDashboard,
  Cog,
  Sparkles,
  Bell,
  CalendarDays,
  FileBarChart,
  LineChart,
  Bot,
  Settings as SettingsIcon,
  LogOut,
  Factory,
  Leaf,
  DollarSign,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { getUser, signOut } from "@/lib/auth";
import { cn } from "@/lib/utils";

const ownerItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Machines", url: "/machines", icon: Cog },
  { title: "Analytics", url: "/analytics", icon: LineChart },
  { title: "Sustainability", url: "/sustainability", icon: Leaf },
  { title: "Alerts", url: "/alerts", icon: Bell },
  { title: "AI Prediction", url: "/predict", icon: Sparkles },
  { title: "Maintenance", url: "/maintenance", icon: CalendarDays },
  { title: "Finance", url: "/finance", icon: DollarSign },
  { title: "Reports", url: "/reports", icon: FileBarChart },
  { title: "Settings", url: "/settings", icon: SettingsIcon },
];

const supervisorItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Machines", url: "/machines", icon: Cog },
  { title: "Sustainability", url: "/sustainability", icon: Leaf },
  { title: "Alerts", url: "/alerts", icon: Bell },
  { title: "Maintenance", url: "/maintenance", icon: CalendarDays },
  { title: "AI Assistant", url: "/assistant", icon: Bot },
  { title: "Settings", url: "/settings", icon: SettingsIcon },
];

export function AppSidebar() {
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const currentUser = getUser();
  const isOwner = currentUser?.role === "owner";
  const items = isOwner ? ownerItems : supervisorItems;
  const greetingName = currentUser?.name?.trim() || (isOwner ? "Founder" : "Supervisor");

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2 px-2 py-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-gradient-to-br from-info to-primary text-primary-foreground shadow-lg shadow-primary/30">
            <Factory className="h-5 w-5" />
          </div>
          <div className="flex flex-col leading-tight group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-semibold text-sidebar-foreground">Smart Factory</span>
            <span className="text-xs text-sidebar-foreground/60">Insights AI</span>
            <span className="mt-1 text-[11px] font-medium text-primary">Hello, {greetingName}</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const active = path === item.url || path.startsWith(item.url + "/");
                const isHovered = hoveredItem === item.url;
                return (
                  <SidebarMenuItem key={item.url} className="transition-all duration-200">
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      tooltip={item.title}
                      onMouseEnter={() => setHoveredItem(item.url)}
                      onMouseLeave={() => setHoveredItem(null)}
                      className={cn(
                        "transition-all duration-200 ease-out",
                        isHovered && "translate-y-[-2px] scale-[1.03]",
                        isHovered && !active && "border border-primary/20 bg-accent/80 shadow-lg shadow-primary/15",
                        isHovered && active && "border border-primary/30 bg-primary/15 shadow-lg shadow-primary/20",
                        hoveredItem && !isHovered && !active && "opacity-45 brightness-75",
                        hoveredItem && !isHovered && active && "opacity-60 brightness-90",
                        active && !isHovered && "bg-primary/10 shadow-sm shadow-primary/10"
                      )}
                    >
                      <Link to={item.url} className="w-full rounded-md">
                        <item.icon />
                        <span>{item.title}</span>
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
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={async () => {
                if (isSigningOut) return;
                setIsSigningOut(true);
                await signOut();
                navigate({ to: "/auth" });
              }}
              tooltip="Sign out"
              disabled={isSigningOut}
            >
              <LogOut />
              <span>Sign out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
