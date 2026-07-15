import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useMachines } from "@/lib/store";
import { StatusBadge } from "@/components/status-badge";
import { AddMachineDialog } from "@/components/add-machine-dialog";

export const Route = createFileRoute("/_app/machines")({
  component: MachinesPage,
});

function MachinesPage() {
  const machines = useMachines();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);

  const list = useMemo(() => {
    const s = q.toLowerCase();
    if (!s) return machines;
    return machines.filter((m) =>
      [m.name, m.machineId, m.type, m.section].some((v) => v.toLowerCase().includes(s)),
    );
  }, [q, machines]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Machines</h1>
          <p className="text-sm text-muted-foreground">
            {machines.length} connected assets · click a card to inspect
          </p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search name, ID, type, location..."
              className="pl-8 md:w-80"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <Button onClick={() => setOpen(true)} className="bg-gradient-to-r from-primary to-info">
            <Plus className="h-4 w-4" /> Add
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {list.map((m) => (
          <Link key={m.id} to="/machines/$id" params={{ id: m.id }}>
            <Card className="group h-full cursor-pointer border-border/50 bg-gradient-to-br from-card to-card/60 backdrop-blur-md transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{m.name}</CardTitle>
                    <p className="mt-0.5 font-mono text-xs text-muted-foreground">{m.machineId}</p>
                  </div>
                  <StatusBadge status={m.status} />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-xs text-muted-foreground">
                  {m.type} · {m.section}
                </div>
                <div>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Health</span>
                    <span className="font-semibold">{m.healthScore}%</span>
                  </div>
                  <Progress value={m.healthScore} className="h-1.5" />
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <Metric label="Temp" v={`${m.temperature}°`} />
                  <Metric label="Vib" v={`${m.vibration}`} />
                  <Metric label="RPM" v={`${m.rpm}`} />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
        {list.length === 0 && (
          <div className="col-span-full py-16 text-center text-sm text-muted-foreground">
            No machines match your search.
          </div>
        )}
      </div>

      <AddMachineDialog open={open} onOpenChange={setOpen} />
    </div>
  );
}

function Metric({ label, v }: { label: string; v: string }) {
  return (
    <div className="rounded-md border border-border/50 bg-background/40 p-2 text-center">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="font-semibold">{v}</div>
    </div>
  );
}
