import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, Bell, Wrench, Power } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useMachines } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/alerts")({
  component: AlertsPage,
});

interface Alert {
  id: string;
  kind: "critical" | "warning" | "maintenance" | "shutdown";
  machine: string;
  reason: string;
  time: string;
  priority: "High" | "Medium" | "Low";
}

function AlertsPage() {
  const machines = useMachines();
  const alerts: Alert[] = [];
  const now = Date.now();

  for (const m of machines) {
    if (m.status === "critical") {
      alerts.push({ id: `${m.id}-c`, kind: "critical", machine: m.name, reason: `Health ${m.healthScore}% — immediate maintenance required`, time: "just now", priority: "High" });
    }
    if (m.status === "warning1" || m.status === "warning2") {
      alerts.push({ id: `${m.id}-w`, kind: "warning", machine: m.name, reason: `Elevated ${m.status === "warning2" ? "L2" : "L1"} — schedule inspection`, time: "5m ago", priority: m.status === "warning2" ? "High" : "Medium" });
    }
    const days = Math.round((now - new Date(m.lastMaintenance).getTime()) / 86400000);
    if (days > m.serviceIntervalDays) {
      alerts.push({ id: `${m.id}-m`, kind: "maintenance", machine: m.name, reason: `Overdue by ${days - m.serviceIntervalDays} days`, time: "today", priority: "Medium" });
    }
    if (m.status === "off") {
      alerts.push({ id: `${m.id}-s`, kind: "shutdown", machine: m.name, reason: "Machine shutdown due to safety", time: "recent", priority: "High" });
    }
  }

  const groups: Array<{ key: Alert["kind"]; title: string; icon: React.ComponentType<{ className?: string }>; color: string }> = [
    { key: "critical", title: "Critical Alerts", icon: AlertTriangle, color: "text-destructive" },
    { key: "warning", title: "Warnings", icon: Bell, color: "text-warning" },
    { key: "maintenance", title: "Maintenance Due", icon: Wrench, color: "text-info" },
    { key: "shutdown", title: "Shutdown Machines", icon: Power, color: "text-muted-foreground" },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Alerts</h1>
        <p className="text-sm text-muted-foreground">{alerts.length} active alerts across the fleet</p>
      </div>

      {groups.map((g) => {
        const items = alerts.filter((a) => a.kind === g.key);
        if (!items.length) return null;
        return (
          <Card key={g.key} className="border-border/50 bg-gradient-to-br from-card to-card/60 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <g.icon className={cn("h-4 w-4", g.color)} /> {g.title} ({items.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {items.map((a) => (
                <div key={a.id} className="flex items-start justify-between gap-3 rounded-md border border-border/60 bg-background/40 p-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{a.machine}</span>
                      <Badge variant={a.priority === "High" ? "destructive" : "secondary"}>{a.priority}</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">{a.reason}</div>
                  </div>
                  <div className="text-xs text-muted-foreground">{a.time}</div>
                </div>
              ))}
            </CardContent>
          </Card>
        );
      })}

      {alerts.length === 0 && (
        <Card className="border-border/50 bg-gradient-to-br from-card to-card/60 backdrop-blur-md">
          <CardContent className="p-10 text-center text-sm text-muted-foreground">
            No active alerts — the fleet is running smoothly.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
