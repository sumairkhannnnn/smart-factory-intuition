import { useEffect, useState } from "react";
import { Bell, Moon, Search, Sun } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { alerts } from "@/lib/mockData";
import { getUser, observeAuthState } from "@/lib/auth";

export function AppTopbar() {
  const [dark, setDark] = useState(false);
  const [user, setUser] = useState<ReturnType<typeof getUser>>(null);

  useEffect(() => {
    const syncUser = () => {
      const nextUser = getUser();
      setUser(nextUser);
    };

    syncUser();
    const isDark = document.documentElement.classList.contains("dark");
    setDark(isDark);

    const unsubscribe = observeAuthState(() => {
      syncUser();
    });

    return unsubscribe;
  }, []);

  function toggleTheme() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
  }

  const critical = alerts.filter((a) => a.severity === "critical").length;

  return (
    <div className="flex h-14 items-center gap-3 border-b bg-card px-4">
      <div className="relative w-full max-w-sm">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search machines, alerts..." className="pl-8" />
      </div>
      <div className="ml-auto flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
          {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
        <Button variant="ghost" size="icon" className="relative" aria-label="Alerts">
          <Bell className="h-4 w-4" />
          {critical > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-medium text-destructive-foreground">
              {critical}
            </span>
          )}
        </Button>
        <div className="flex items-center gap-2 rounded-md border bg-background px-2 py-1">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
            {(user?.name || "U").slice(0, 1).toUpperCase()}
          </div>
          <div className="hidden text-xs leading-tight sm:block">
            <div className="font-medium">{user?.name || "Guest"}</div>
            <Badge variant="secondary" className="h-4 px-1 text-[10px] capitalize">
              {user?.role || "user"}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
}
