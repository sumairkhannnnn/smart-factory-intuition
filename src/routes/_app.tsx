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
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    document.documentElement.classList.add("dark");

    const storedUser = getUser();
    if (!storedUser) {
      navigate({ to: "/auth" });
      return;
    }

    setReady(true);

    const timer = window.setInterval(() => setCurrentTime(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, [navigate]);

  const formattedDay = new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
  }).format(currentTime);

  const formattedDate = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  }).format(currentTime);

  const formattedTime = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(currentTime);

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
            <div className="mb-5 flex flex-wrap items-end justify-between gap-3 border-b border-border/40 pb-4">
              <div className="space-y-1">
                <div className="text-[11px] font-semibold uppercase tracking-[0.35em] text-primary/80">{formattedDay}</div>
                <div className="text-lg font-medium text-muted-foreground sm:text-xl">{formattedDate}</div>
              </div>
              <div className="font-['Inter'] text-4xl font-semibold tracking-[0.24em] text-foreground sm:text-5xl">
                {formattedTime}
              </div>
            </div>
            <Outlet />
          </main>
        </div>
        <Toaster />
      </div>
    </SidebarProvider>
  );
}
