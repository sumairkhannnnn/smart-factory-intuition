import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { AppTopbar } from "@/components/app-topbar";
import { Toaster } from "@/components/ui/sonner";
import { getUser, observeAuthState } from "@/lib/auth";

export const Route = createFileRoute("/_app")({
  ssr: false,
  component: AppLayout,
});

function AppLayout() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    document.documentElement.classList.add("dark");

    const storedUser = getUser();
    if (!storedUser) {
      navigate({ to: "/auth" });
      return;
    }

    setReady(true);
  }, [navigate]);

  if (!ready) return null;

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <div className="flex flex-1 flex-col">
          <div className="flex items-center gap-1 border-b bg-card pl-2">
            <SidebarTrigger />
            <div className="flex-1">
              <AppTopbar />
            </div>
          </div>
          <main className="flex-1 p-4 md:p-6">
            <Outlet />
          </main>
        </div>
        <Toaster />
      </div>
    </SidebarProvider>
  );
}
