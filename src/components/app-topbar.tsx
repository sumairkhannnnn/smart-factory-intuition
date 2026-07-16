import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Bell, Moon, Search, Sun } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { alerts } from "@/lib/mockData";
import { getUser, observeAuthState } from "@/lib/auth";
import { useMachines } from "@/lib/store";

export function AppTopbar() {
  const navigate = useNavigate();
  const machines = useMachines();
  const [dark, setDark] = useState(false);
  const [user, setUser] = useState<ReturnType<typeof getUser>>(null);
  const [query, setQuery] = useState("");

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

    return () => {
      unsubscribe();
    };
  }, []);

  function toggleTheme() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
  }

  const critical = alerts.filter((a) => a.severity === "critical").length;

  const searchResults = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return [];

    const exactMatches = machines.filter((machine) => {
      const normalizedName = machine.name.toLowerCase();
      const normalizedId = machine.machineId.toLowerCase();
      return normalizedName === value || normalizedId === value || normalizedName.includes(value) || normalizedId.includes(value);
    });

    if (exactMatches.length > 0) {
      return exactMatches.slice(0, 6);
    }

    return machines
      .filter((machine) => {
        const haystack = [machine.name, machine.machineId, machine.type, machine.section, machine.manufacturer, machine.function]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return haystack.includes(value);
      })
      .slice(0, 6);
  }, [machines, query]);

  useEffect(() => {
    const value = query.trim().toLowerCase();
    if (!value || searchResults.length !== 1) return;

    const timer = window.setTimeout(() => {
      setQuery("");
      navigate({ to: "/machines/$id", params: { id: searchResults[0].id } });
    }, 300);

    return () => window.clearTimeout(timer);
  }, [navigate, query, searchResults]);

  function handleSearchKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter") return;

    const match = searchResults[0];
    if (match) {
      setQuery("");
      navigate({ to: "/machines/$id", params: { id: match.id } });
    }
  }

  function openMachine(id: string) {
    setQuery("");
    navigate({ to: "/machines/$id", params: { id } });
  }

  return (
    <div className="flex h-14 items-center gap-3 border-b bg-card px-4">
      <div className="relative w-full max-w-sm">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={handleSearchKeyDown}
          placeholder="Search machines, alerts..."
          className="pl-8"
          aria-label="Search machines"
        />
        {query.trim() && (
          <div className="absolute left-0 right-0 top-full z-50 mt-2 rounded-lg border border-border/60 bg-popover p-2 shadow-xl">
            {searchResults.length > 0 ? (
              searchResults.map((machine) => (
                <button
                  key={machine.id}
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => openMachine(machine.id)}
                  className="flex w-full items-start justify-between rounded-md px-2 py-2 text-left transition hover:bg-muted"
                >
                  <div>
                    <div className="text-sm font-medium text-foreground">{machine.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {machine.machineId} · {machine.section}
                    </div>
                  </div>
                  <span className="text-[10px] uppercase tracking-wide text-primary">Open</span>
                </button>
              ))
            ) : (
              <div className="px-2 py-3 text-sm text-muted-foreground">No matching machines found.</div>
            )}
          </div>
        )}
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
            <div className="font-medium">Hello, {user?.name || "Guest"}</div>
            <Badge variant="secondary" className="h-4 px-1 text-[10px] capitalize">
              {user?.role || "user"}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
}
