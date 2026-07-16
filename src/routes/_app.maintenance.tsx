import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Plus, Check, CalendarDays, Clock3, Wrench, ShieldCheck, AlertCircle, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { maintenance as initial, type MaintenanceEvent } from "@/lib/mockData";
import { performMaintenance, useMachines } from "@/lib/store";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/maintenance")({
  component: MaintenancePage,
});

function MaintenancePage() {
  const fleetMachines = useMachines();
  const [events, setEvents] = useState<MaintenanceEvent[]>(() => {
    if (typeof window === "undefined") return initial;
    try {
      const raw = window.localStorage.getItem("sfi_maintenance_events");
      return raw ? JSON.parse(raw) : initial;
    } catch {
      return initial;
    }
  });
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    machineId: "",
    technician: "",
    task: "",
    date: new Date().toISOString().slice(0, 10),
    cost: "",
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("sfi_maintenance_events", JSON.stringify(events));
    }
  }, [events]);

  useEffect(() => {
    if (fleetMachines.length && (!form.machineId || !fleetMachines.some((m) => m.id === form.machineId))) {
      setForm((prev) => ({ ...prev, machineId: fleetMachines[0].id }));
    }
  }, [fleetMachines, form.machineId]);

  function add() {
    const machine = fleetMachines.find((m) => m.id === form.machineId);
    if (!machine) {
      toast.error("Select a machine first");
      return;
    }
    const parsedCost = Number(form.cost);
    const normalizedCost = Number.isFinite(parsedCost) ? Math.max(0, parsedCost) : 0;
    const ev: MaintenanceEvent = {
      id: `MT-${events.length + 100}`,
      machineId: machine.id,
      machineName: machine.name,
      technician: form.technician || "Unassigned",
      task: form.task || "General inspection",
      date: form.date,
      status: "scheduled",
      cost: normalizedCost,
    };
    setEvents((prev) => [ev, ...prev]);
    toast.success("Maintenance scheduled");
    setOpen(false);
  }

  function complete(id: string) {
    const event = events.find((e) => e.id === id);
    if (event) {
      const machine = fleetMachines.find((m) => m.id === event.machineId) ?? fleetMachines.find((m) => m.name === event.machineName);
      if (machine) {
        performMaintenance(machine.id, {
          engineer: event.technician,
          notes: event.task,
          cost: event.cost ?? 0,
          parts: "Routine service",
          timeTaken: "2h",
        });
      }
    }
    setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, status: "completed" } : e)));
    toast.success("Maintenance complete — health restored to 100%");
  }

  function remove(id: string) {
    const event = events.find((e) => e.id === id);
    if (!event) return;
    if (!window.confirm(`Remove ${event.machineName} from maintenance list?`)) return;
    setEvents((prev) => prev.filter((e) => e.id !== id));
    toast.success("Maintenance item removed");
  }

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = useMemo(() => {
    return events
      .filter((e) => e.status !== "completed")
      .map((e) => ({ ...e, displayStatus: e.date === today ? "in-progress" : e.status }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [events, today]);
  const past = useMemo(() => events.filter((e) => e.status === "completed").sort((a, b) => b.date.localeCompare(a.date)), [events]);

  const summary = useMemo(() => {
    return {
      open: upcoming.length,
      dueToday: upcoming.filter((e) => e.date === today).length,
      inProgress: upcoming.filter((e) => e.status === "in-progress").length,
      completed: past.length,
    };
  }, [upcoming, past, today]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Maintenance Planner</h1>
          <p className="text-sm text-muted-foreground">Keep maintenance tasks organized, visible, and easy to complete.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-primary to-info">
              <Plus className="mr-2 h-4 w-4" /> Schedule work
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Schedule maintenance</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>Machine</Label>
                <Select value={form.machineId} onValueChange={(v) => setForm({ ...form, machineId: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {fleetMachines.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Technician</Label>
                <Input value={form.technician} onChange={(e) => setForm({ ...form, technician: e.target.value })} placeholder="Ravi Kumar" />
              </div>
              <div className="space-y-1.5">
                <Label>Task</Label>
                <Input value={form.task} onChange={(e) => setForm({ ...form, task: e.target.value })} placeholder="Bearing replacement" />
              </div>
              <div className="space-y-1.5">
                <Label>Estimated price (₹)</Label>
                <Input
                  type="number"
                  min="0"
                  step="100"
                  value={form.cost}
                  onChange={(e) => setForm({ ...form, cost: e.target.value })}
                  placeholder="2500"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Date</Label>
                <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={add}>Save work order</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <SummaryCard title="Open work orders" value={summary.open} icon={Wrench} accent="text-primary" />
        <SummaryCard title="Due today" value={summary.dueToday} icon={CalendarDays} accent="text-success" />
        <SummaryCard title="In progress" value={summary.inProgress} icon={Clock3} accent="text-warning" />
        <SummaryCard title="Completed" value={summary.completed} icon={ShieldCheck} accent="text-info" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="border-border/50 bg-gradient-to-br from-card to-card/60 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-warning" /> Upcoming work ({upcoming.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {upcoming.map((e) => (
              <div key={e.id} className="rounded-xl border border-border/50 bg-background/60 p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="font-semibold text-foreground">{e.machineName}</div>
                    <div className="mt-1 text-sm text-muted-foreground">{e.task}</div>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                      <span className="rounded-full bg-background/80 px-2 py-1">{e.technician}</span>
                      <span className="rounded-full bg-background/80 px-2 py-1">{e.date}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge variant={e.displayStatus === "in-progress" ? "default" : "outline"} className="capitalize">
                      {e.displayStatus === "in-progress" ? "In progress" : e.displayStatus === "scheduled" ? "Scheduled" : e.displayStatus}
                    </Badge>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => complete(e.id)}>
                        <Check className="mr-1 h-3.5 w-3.5" /> Complete
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => remove(e.id)} className="text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {upcoming.length === 0 && <div className="text-sm text-muted-foreground">No upcoming maintenance.</div>}
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-gradient-to-br from-card to-card/60 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-success" /> Recent completions ({past.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {past.map((e) => (
              <div key={e.id} className="rounded-xl border border-border/50 bg-background/60 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-semibold text-foreground">{e.machineName}</div>
                    <div className="mt-1 text-sm text-muted-foreground">{e.task}</div>
                    <div className="mt-2 text-xs text-muted-foreground">{e.technician}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{e.date}</Badge>
                    <Button size="sm" variant="ghost" onClick={() => remove(e.id)} className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            {past.length === 0 && <div className="text-sm text-muted-foreground">No completed items yet.</div>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function SummaryCard({ title, value, icon: Icon, accent }: { title: string; value: number; icon: React.ComponentType<{ className?: string }>; accent: string }) {
  return (
    <Card className="border-border/50 bg-gradient-to-br from-card to-card/60 backdrop-blur-md">
      <CardContent className="flex items-center justify-between p-4">
        <div>
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{title}</div>
          <div className="mt-1 text-2xl font-semibold tracking-tight">{value}</div>
        </div>
        <div className={`rounded-lg border border-border/60 bg-background/70 p-2 ${accent}`}>
          <Icon className="h-4 w-4" />
        </div>
      </CardContent>
    </Card>
  );
}
