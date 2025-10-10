"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarRail,
} from "@/components/ui/sidebar";
import {
  Calendar,
  FolderOpen,
  Home,
  Settings,
  Users,
  FileText,
  UserPlus,
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/admin", icon: Home },
  { name: "Cohorts", href: "/admin/cohorts", icon: Users },
  { name: "Sessions", href: "/admin/sessions", icon: Calendar },
  { name: "Content", href: "/admin/content", icon: FolderOpen },
  { name: "Applications", href: "/admin/applications", icon: FileText },
  { name: "Fellows", href: "/admin/fellows", icon: Users },
  { name: "Invite", href: "/admin/invite", icon: UserPlus },
  { name: "Settings", href: "/admin/settings", icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="offcanvas">
      <SidebarHeader className="border-b border-border">
        <div className="flex h-16 items-center gap-2 px-4">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">
              FP
            </span>
          </div>
          <span className="font-semibold">Fellowship Platform</span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarMenu>
          {navigation.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <SidebarMenuItem key={item.name}>
                <SidebarMenuButton
                  asChild
                  isActive={isActive}
                  tooltip={item.name}
                >
                  <Link href={item.href}>
                    <item.icon />
                    <span>{item.name}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="border-t border-border">
        <div className="p-4">
          <p className="text-xs text-muted-foreground">Admin Portal</p>
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
