'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Clock, LayoutDashboard, Shield, LogOut, User, Settings, Bell, Eye, Activity } from 'lucide-react';

import { useAuth } from '@/hooks/use-auth';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarTrigger
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { NotificationDropdown } from '@/components/dashboard/notification-dropdown';
import { RealTimeClock, MinimalClock } from '@/components/dashboard/real-time-clock';
import { DatabaseStatusIndicator } from '@/components/ui/database-status';
import MaintenanceWrapper from '@/components/maintenance/maintenance-wrapper';


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, logout, loading, isAdmin, isInspection } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);
  
  if (loading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <MaintenanceWrapper>
      <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <Sidebar className="border-r bg-sidebar">
          <SidebarHeader className="p-4 lg:p-6 border-b border-sidebar-border">
            <div className="flex items-center gap-3">
  <div className="flex items-center justify-center w-12 h-12 bg-white rounded-lg shadow-sm overflow-hidden">
    <img 
      src="/images/logos/trg-logo.png" 
      alt="TRG Logo" 
      className="w-8 h-8 object-contain" 
    />
  </div>
  <div className="flex-1 min-w-0">
    <h1 className="text-xl font-bold text-sidebar-foreground font-headline truncate poppins-heading">
      TimeWise
    </h1>
    <p className="text-sm text-sidebar-foreground/70 font-medium truncate poppins-optimized">
      Time Management
    </p>
  </div>
</div>

          </SidebarHeader>
          <SidebarContent className="px-3 py-4 lg:px-4 lg:py-6 flex flex-col h-full">
            <div className="space-y-4 flex-1">
              <div className="px-3 py-2">
                <h2 className="sidebar-section-title mb-4">
                  Navigation
                </h2>
              </div>
              <SidebarMenu className="space-y-1">
                {/* Show user dashboard for regular users */}
                {user.role === 'User' && (
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="Dashboard">
                      <Link href="/dashboard/user" className="group">
                        <LayoutDashboard className="transition-colors group-hover:text-primary" />
                        <span className="font-medium">Dashboard</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}

                {/* Show inspection dashboard for inspection role */}
                {user.role === 'Inspection' && (
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="Inspection Dashboard">
                      <Link href="/dashboard/inspection" className="group">
                        <Eye className="transition-colors group-hover:text-primary" />
                        <span className="font-medium">Inspection</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}

                {/* Show admin options for admin role */}
                {user.role === 'Admin' && (
                  <>
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild tooltip="Dashboard">
                        <Link href="/dashboard/user" className="group">
                          <LayoutDashboard className="transition-colors group-hover:text-primary" />
                          <span className="font-medium">Dashboard</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild tooltip="Admin Panel">
                        <Link href="/dashboard/admin" className="group">
                          <Shield className="transition-colors group-hover:text-primary" />
                          <span className="font-medium">Admin Panel</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild tooltip="System Settings">
                        <Link href="/dashboard/settings" className="group">
                          <Settings className="transition-colors group-hover:text-primary" />
                          <span className="font-medium">Settings</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </>
                )}

                {/* Show developer options for developer role */}
                {user.role === 'Developer' && (
                  <>
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild tooltip="System Diagnostics">
                        <Link href="/dashboard/diagnostics" className="group">
                          <Activity className="transition-colors group-hover:text-primary" />
                          <span className="font-medium">Diagnostics</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </>
                )}
              </SidebarMenu>
            </div>
            
            {/* Lab of Future Footer */}
            <div className="sidebar-footer px-3 py-4 rounded-lg">
              <div className="flex flex-col items-center justify-end">
                <p className="lab-of-future-brand cursor-default mb-0">DEVELOPED BY</p>
                <div className="flex items-center justify-center -mt-9">
                  <img 
                    src="/images/logos/lof-alternate.png" 
                    alt="Lab of Future Logo" 
                    className="lof-logo cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </SidebarContent>
        </Sidebar>
        <div className="flex flex-1 flex-col">
          <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/80 px-6 backdrop-blur-sm">
            <SidebarTrigger className="md:hidden" />
            <div className="flex-1">
              {/* Optional: Add search or other header content here */}
            </div>
            <div className="flex items-center gap-4">
              {/* Database status indicator */}
              <DatabaseStatusIndicator className="hidden md:flex" />
              {/* Full clock for desktop */}
              <RealTimeClock className="hidden lg:flex" />
              {/* Minimal clock for tablets */}
              <MinimalClock className="hidden sm:flex lg:hidden" />
              {/* Hide notifications for Inspection role */}
              {!isInspection() && <NotificationDropdown />}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                   <Avatar>
                    <AvatarFallback className="bg-primary text-primary-foreground">{user.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>{user.name}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </header>
          <SidebarInset>
            <main className="flex-1 p-6 lg:p-8">{children}</main>
          </SidebarInset>
        </div>
      </div>
    </SidebarProvider>
    </MaintenanceWrapper>
  );
}
