import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Check } from "lucide-react";
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
import { maintenance as initial, machines, type MaintenanceEvent } from "@/lib/mockData";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/maintenance")({
  component: MaintenancePage,
});

function MaintenancePage() {
  const [events, setEvents] = useState<MaintenanceEvent[]>(initial);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    machineId: machines[0].id,
    technician: "",
    task: "",
    date: new Date().toISOString().slice(0, 10),
  });

  function add() {
    const machine = machines.find((m) => m.id === form.machineId)!;
    const ev: MaintenanceEvent = {
      id: `MT-${events.length + 100}`,
      machineId: machine.id,
      machineName: machine.name,
      technician: form.technician || "Unassigned",
      task: form.task || "General inspection",
      date: form.date,
      status: "scheduled",
    };
    setEvents([ev, ...events]);
    toast.success("Maintenance scheduled");
    setOpen(false);
  }

  function complete(id: string) {
    setEvents(events.map((e) => (e.id === id ? { ...e, status: "completed" } : e)));
    toast.success("Marked complete");
  }

  const upcoming = events.filter((e) => e.status !== "completed");
  const past = events.filter((e) => e.status === "completed");

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Maintenance Scheduler</h1>
          <p className="text-sm text-muted-foreground">Plan and track factory maintenance</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Schedule
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Schedule maintenance</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>Machine</Label>
                <Select
                  value={form.machineId}
                  onValueChange={(v) => setForm({ ...form, machineId: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {machines.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Technician</Label>
                <Input
                  value={form.technician}
                  onChange={(e) => setForm({ ...form, technician: e.target.value })}
                  placeholder="Ravi Kumar"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Task</Label>
                <Input
                  value={form.task}
                  onChange={(e) => setForm({ ...form, task: e.target.value })}
                  placeholder="Bearing replacement"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={add}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Upcoming ({upcoming.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {upcoming.map((e) => (
              <div key={e.id} className="flex items-center justify-between rounded-md border p-3">
                <div>
                  <div className="font-medium">{e.machineName}</div>
                  <div className="text-xs text-muted-foreground">
                    {e.task} · {e.technician}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="secondary">{e.date}</Badge>
                  <Badge
                    variant={e.status === "in-progress" ? "default" : "outline"}
                    className="capitalize"
                  >
                    {e.status}
                  </Badge>
                  <Button size="sm" variant="ghost" onClick={() => complete(e.id)}>
                    <Check className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            {upcoming.length === 0 && (
              <div className="text-sm text-muted-foreground">No upcoming maintenance.</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Completed ({past.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {past.map((e) => (
              <div key={e.id} className="flex items-center justify-between rounded-md border p-3">
                <div>
                  <div className="font-medium">{e.machineName}</div>
                  <div className="text-xs text-muted-foreground">
                    {e.task} · {e.technician}
                  </div>
                </div>
                <Badge variant="secondary">{e.date}</Badge>
              </div>
            ))}
            {past.length === 0 && (
              <div className="text-sm text-muted-foreground">No completed items yet.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
