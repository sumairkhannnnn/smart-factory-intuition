import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  Thermometer,
  Activity,
  Zap,
  Droplets,
  Gauge,
  Clock,
  Edit3,
  Wrench,
  Bug,
  AlertTriangle,
  Plus,
  DollarSign,
  Power,
  Trash2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, RadialBarChart, RadialBar } from "recharts";
import {
  useMachines,
  updateMachine,
  performMaintenance,
  addBug,
  toggleBug,
  criticalExplanation,
  deleteMachine,
  type MachineStatus,
} from "@/lib/store";
import { StatusBadge } from "@/components/status-badge";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/machines/$id")({
  component: MachineDetail,
});

const COMMON_BUGS = [
  "Bearing Failure",
  "Motor Overheating",
  "Oil Leakage",
  "Loose Belt",
  "Abnormal Vibration",
  "Electrical Fault",
  "Broken Sensor",
];

function seriesFrom(base: number, spread: number, seed: number) {
  let x = seed;
  const rnd = () => ((x = (x * 9301 + 49297) % 233280) / 233280);
  return Array.from({ length: 24 }).map((_, i) => ({
    time: `${String(i).padStart(2, "0")}:00`,
    value: +(base + (rnd() - 0.5) * spread).toFixed(2),
  }));
}

function MachineDetail() {
  const { id } = useParams({ from: "/_app/machines/$id" });
  const machines = useMachines();
  const m = machines.find((x) => x.id === id);
  const [editOpen, setEditOpen] = useState(false);
  const [maintOpen, setMaintOpen] = useState(false);
  const [bugText, setBugText] = useState("");
  const navigate = useNavigate();

  if (!m) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" asChild>
          <Link to="/machines"><ArrowLeft className="h-4 w-4" /> Back</Link>
        </Button>
        <p className="text-muted-foreground">Machine not found.</p>
      </div>
    );
  }

  const isCritical = m.status === "critical";
  const isOff = m.status === "off";
  const isWarn2 = m.status === "warning2";
  const daysSinceMaint = Math.round((Date.now() - new Date(m.lastMaintenance).getTime()) / 86400000);
  const temp = seriesFrom(m.temperature, 10, m.runningHours + 1);
  const vib = seriesFrom(m.vibration, 3, m.runningHours + 2);
  const cur = seriesFrom(m.motorCurrent, 4, m.runningHours + 3);
  const gauge = [{ name: "Health", value: m.healthScore, fill: healthColor(m.healthScore) }];
  const reasons = useMemo(() => criticalExplanation(m), [m]);
  const openBugs = m.bugs.filter((b) => !b.resolved).length;

  function shutdown() {
    updateMachine(m!.id, { status: "off", healthScore: 0 });
    toast.warning(`${m!.name} shut down for safety`);
  }

  function handleDelete() {
    if (!window.confirm(`Delete ${m.name}?`)) return;
    deleteMachine(m.id);
    toast.success(`${m.name} removed`);
    navigate({ to: "/machines" });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/machines"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight">{m.name}</h1>
              <StatusBadge status={m.status} />
            </div>
            <p className="text-sm text-muted-foreground">
              {m.machineId} · {m.type} · {m.section} · {m.manufacturer}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setEditOpen(true)}><Edit3 className="h-4 w-4" /> Edit</Button>
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="h-4 w-4" /> Delete
          </Button>
          <Button onClick={() => setMaintOpen(true)} className="bg-gradient-to-r from-success to-info">
            <Wrench className="h-4 w-4" /> Perform Maintenance
          </Button>
        </div>
      </div>

      {isWarn2 && (
        <Card className="border-warning/60 bg-warning/10 backdrop-blur-md">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-warning" />
              <div className="text-sm">
                <b>Warning Level 2 —</b> Machine will automatically shut down if maintenance is not completed.
              </div>
            </div>
            <Button variant="destructive" size="sm" onClick={shutdown}>
              <Power className="h-4 w-4" /> Shutdown Now
            </Button>
          </CardContent>
        </Card>
      )}

      {isOff && (
        <Card className="border-muted-foreground/40 bg-muted/30 backdrop-blur-md">
          <CardContent className="flex items-center gap-3 p-4">
            <Power className="h-5 w-5 text-muted-foreground" />
            <div className="text-sm"><b>Machine Shutdown Due to Safety.</b> Perform maintenance to bring it back online.</div>
          </CardContent>
        </Card>
      )}

      {isCritical && (
        <Card className="border-destructive/50 bg-destructive/5 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" /> Why is it Critical?
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <div className="md:col-span-2 space-y-2 text-sm">
              <div className="font-semibold">AI-detected reasons:</div>
              <ul className="space-y-1.5">
                {reasons.map((r, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-destructive" />
                    {r}
                  </li>
                ))}
              </ul>
              <div className="mt-3 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-xs">
                <b>Recommended Action:</b> Immediate Maintenance Required.
              </div>
            </div>
            <div className="flex flex-col items-center justify-center rounded-lg border border-destructive/40 bg-background/40 p-4">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">Risk Score</div>
              <div className="text-5xl font-bold text-destructive">{m.failureProbability}%</div>
              <div className="mt-2 text-xs text-muted-foreground">Confidence {m.confidence}%</div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <Metric icon={Thermometer} label="Temperature" value={`${Math.round(m.temperature)}°C`} />
        <Metric icon={Activity} label="Vibration" value={`${Number(m.vibration.toFixed(1))} mm/s`} />
        <Metric icon={Zap} label="Motor Current" value={`${Number(m.motorCurrent.toFixed(1))} A`} />
        <Metric icon={Gauge} label="Power" value={`${m.power} kW`} />
        <Metric icon={Clock} label="Running Hours" value={m.runningHours.toString()} />
        <Metric icon={Droplets} label="Humidity" value={`${Math.round(m.humidity)}%`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-border/50 bg-gradient-to-br from-card to-card/60 backdrop-blur-md">
          <CardHeader><CardTitle>Temperature (24h)</CardTitle></CardHeader>
          <CardContent className="h-64"><ChartLine data={temp} color="var(--color-warning)" /></CardContent>
        </Card>

        <Card className="border-border/50 bg-gradient-to-br from-card to-card/60 backdrop-blur-md">
          <CardHeader><CardTitle>Health Score</CardTitle></CardHeader>
          <CardContent className="flex h-64 items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart cx="50%" cy="50%" innerRadius="70%" outerRadius="100%" data={gauge} startAngle={220} endAngle={-40}>
                <RadialBar background dataKey="value" cornerRadius={12} />
                <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="fill-foreground text-3xl font-bold">
                  {m.healthScore}%
                </text>
              </RadialBarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-gradient-to-br from-card to-card/60 backdrop-blur-md">
          <CardHeader><CardTitle>Vibration (24h)</CardTitle></CardHeader>
          <CardContent className="h-64"><ChartLine data={vib} color="var(--color-info)" /></CardContent>
        </Card>

        <Card className="border-border/50 bg-gradient-to-br from-card to-card/60 backdrop-blur-md">
          <CardHeader><CardTitle>Motor Current (24h)</CardTitle></CardHeader>
          <CardContent className="h-64"><ChartLine data={cur} color="var(--color-primary)" /></CardContent>
        </Card>

        <Card className="border-border/50 bg-gradient-to-br from-card to-card/60 backdrop-blur-md">
          <CardHeader><CardTitle>AI Prediction</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Row label="Failure probability">
              <div className="flex items-center gap-2">
                <Progress value={m.failureProbability} className="h-2 w-32" />
                <span className="font-semibold">{m.failureProbability}%</span>
              </div>
            </Row>
            <Row label="Confidence">
              <div className="flex items-center gap-2">
                <Progress value={m.confidence} className="h-2 w-32" />
                <span className="font-semibold">{m.confidence}%</span>
              </div>
            </Row>
            <Row label="Remaining useful life"><span className="font-semibold">{m.remainingDays} days</span></Row>
            <Row label="Last maintenance"><span className="font-semibold">{m.lastMaintenance} ({daysSinceMaint}d ago)</span></Row>
            <div className="rounded-md border bg-accent/40 p-3 text-xs">
              <b>Recommendation:</b>{" "}
              {isCritical ? "Immediate maintenance required." : isWarn2 ? "Schedule maintenance within 24h." : m.status === "warning1" ? "Schedule inspection this week." : "Continue routine checks."}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-border/50 bg-gradient-to-br from-card to-card/60 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bug className="h-4 w-4 text-warning" /> Reported Issues
              {openBugs > 0 && <span className="rounded-full bg-warning/20 px-2 py-0.5 text-xs text-warning">{openBugs} open</span>}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-1.5">
              {COMMON_BUGS.map((b) => (
                <button
                  key={b}
                  onClick={() => { addBug(m.id, b); toast.success("Issue reported"); }}
                  className="rounded-full border border-border/60 bg-background/50 px-2.5 py-1 text-xs hover:border-warning/50 hover:bg-warning/10"
                >
                  <Plus className="mr-1 inline h-3 w-3" />{b}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <Input placeholder="Custom issue..." value={bugText} onChange={(e) => setBugText(e.target.value)} />
              <Button
                onClick={() => { if (bugText.trim()) { addBug(m.id, bugText.trim()); setBugText(""); toast.success("Issue reported"); } }}
              >Add</Button>
            </div>
            <div className="space-y-2">
              {m.bugs.length === 0 && <p className="text-xs text-muted-foreground">No issues reported.</p>}
              {m.bugs.map((b) => (
                <div key={b.id} className="flex items-center justify-between rounded-md border border-border/60 bg-background/40 p-2 text-sm">
                  <div className={b.resolved ? "text-muted-foreground line-through" : ""}>
                    <div className="font-medium">{b.title}</div>
                    <div className="text-xs text-muted-foreground">{new Date(b.reportedAt).toLocaleString()}</div>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => toggleBug(m.id, b.id)}>
                    {b.resolved ? "Reopen" : "Resolve"}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-gradient-to-br from-card to-card/60 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-success" /> Maintenance History
              <span className="ml-auto text-xs text-muted-foreground">Total ${m.maintenanceCost.toLocaleString()}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {m.history.length === 0 && <p className="text-xs text-muted-foreground">No maintenance yet.</p>}
            {m.history.map((h) => (
              <div key={h.id} className="rounded-md border border-border/60 bg-background/40 p-3">
                <div className="flex items-center justify-between">
                  <div className="font-medium">{h.notes || "Maintenance"}</div>
                  <span className="text-xs text-success">${h.cost.toLocaleString()}</span>
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {h.date} · {h.engineer} · {h.timeTaken} · Parts: {h.parts || "—"}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <EditDialog open={editOpen} onOpenChange={setEditOpen} machine={m} />
      <MaintenanceDialog open={maintOpen} onOpenChange={setMaintOpen} machineId={m.id} machineName={m.name} />
    </div>
  );
}

function healthColor(v: number) {
  if (v >= 75) return "var(--color-success)";
  if (v >= 50) return "var(--color-warning)";
  return "var(--color-destructive)";
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      {children}
    </div>
  );
}

function Metric({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <Card className="border-border/50 bg-gradient-to-br from-card to-card/60 backdrop-blur-md">
      <CardContent className="p-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Icon className="h-3.5 w-3.5 text-info" />
          {label}
        </div>
        <div className="mt-1 text-lg font-semibold">{value}</div>
      </CardContent>
    </Card>
  );
}

function ChartLine({ data, color }: { data: { time: string; value: number }[]; color: string }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
        <XAxis dataKey="time" fontSize={10} stroke="var(--color-muted-foreground)" />
        <YAxis fontSize={10} stroke="var(--color-muted-foreground)" />
        <Tooltip contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 8 }} />
        <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

function EditDialog({ open, onOpenChange, machine }: { open: boolean; onOpenChange: (o: boolean) => void; machine: { id: string; name: string; type: string; status: MachineStatus; function?: string; lastMaintenance: string; maintenanceCost: number } }) {
  const [form, setForm] = useState({
    name: machine.name,
    type: machine.type,
    status: machine.status,
    function: machine.function || "",
    lastMaintenance: machine.lastMaintenance,
    maintenanceCost: machine.maintenanceCost,
  });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Edit Machine</DialogTitle></DialogHeader>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1.5"><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>Type</Label><Input value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} /></div>
          <div className="space-y-1.5 md:col-span-2"><Label>Function</Label><Input value={form.function} onChange={(e) => setForm({ ...form, function: e.target.value })} /></div>
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as MachineStatus })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="healthy">Very Good Condition</SelectItem>
                <SelectItem value="good">Good Condition</SelectItem>
                <SelectItem value="warning1">Warning</SelectItem>
                <SelectItem value="warning2">Warning</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="off">Power Off</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5"><Label>Last Maintenance</Label><Input type="date" value={form.lastMaintenance} onChange={(e) => setForm({ ...form, lastMaintenance: e.target.value })} /></div>
          <div className="space-y-1.5 md:col-span-2"><Label>Total Expenses ($)</Label><Input type="number" value={form.maintenanceCost} onChange={(e) => setForm({ ...form, maintenanceCost: Number(e.target.value) || 0 })} /></div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => { updateMachine(machine.id, form); toast.success("Machine updated"); onOpenChange(false); }}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function MaintenanceDialog({ open, onOpenChange, machineId, machineName }: { open: boolean; onOpenChange: (o: boolean) => void; machineId: string; machineName: string }) {
  const [form, setForm] = useState({ engineer: "", notes: "", cost: 0, parts: "", timeTaken: "" });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Perform Maintenance — {machineName}</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          <div className="space-y-1.5"><Label>Maintenance Engineer</Label><Input value={form.engineer} onChange={(e) => setForm({ ...form, engineer: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>Repair Notes</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="space-y-1.5"><Label>Cost ($)</Label><Input type="number" value={form.cost} onChange={(e) => setForm({ ...form, cost: Number(e.target.value) || 0 })} /></div>
            <div className="space-y-1.5"><Label>Parts Replaced</Label><Input value={form.parts} onChange={(e) => setForm({ ...form, parts: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Time Taken</Label><Input placeholder="e.g. 2h" value={form.timeTaken} onChange={(e) => setForm({ ...form, timeTaken: e.target.value })} /></div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            className="bg-gradient-to-r from-success to-info"
            onClick={() => {
              if (!form.engineer) { toast.error("Engineer name required"); return; }
              performMaintenance(machineId, form);
              toast.success("Maintenance complete — health restored to 100%");
              onOpenChange(false);
            }}
          >Complete Maintenance</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
