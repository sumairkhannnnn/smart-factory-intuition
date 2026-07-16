import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Search, Plus, Trash2, ChevronLeft, ChevronRight, DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { deleteMachine, useMachines } from "@/lib/store";
import { StatusBadge } from "@/components/status-badge";
import { AddMachineDialog } from "@/components/add-machine-dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/machines")({
  component: MachinesPage,
});

function MachinesPage() {
  const machines = useMachines();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [financeMonth, setFinanceMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [financeYear, setFinanceYear] = useState(() => new Date().getFullYear());

  const formatCurrency = (value: number) => `₹${Math.round(value).toLocaleString("en-IN")}`;

  const list = useMemo(() => {
    const s = q.toLowerCase();
    if (!s) return machines;
    return machines.filter((m) =>
      [m.name, m.machineId, m.type, m.section].some((v) => v.toLowerCase().includes(s)),
    );
  }, [q, machines]);

  function handleDeleteMachine(event: React.MouseEvent, machineId: string, machineName: string) {
    event.preventDefault();
    event.stopPropagation();
    if (!window.confirm(`Delete ${machineName}?`)) return;
    deleteMachine(machineId);
    toast.success(`${machineName} removed`);
  }

  const financeHistory = useMemo(() => {
    const monthMap = new Map<string, Array<{ date: string; machineName: string; cost: number; notes: string }>>();

    machines.forEach((machine) => {
      machine.history.forEach((entry) => {
        const month = entry.date.slice(0, 7);
        const items = monthMap.get(month) ?? [];
        items.push({
          date: entry.date,
          machineName: machine.name,
          cost: entry.cost,
          notes: entry.notes,
        });
        monthMap.set(month, items);
      });
    });

    const months = Array.from(monthMap.keys()).sort().reverse();
    const activeMonth = months.includes(financeMonth) ? financeMonth : months[0] ?? new Date().toISOString().slice(0, 7);
    const monthEntries = (monthMap.get(activeMonth) ?? []).sort((a, b) => b.date.localeCompare(a.date));

    return {
      months,
      activeMonth,
      monthEntries,
      monthTotal: monthEntries.reduce((sum, entry) => sum + entry.cost, 0),
    };
  }, [machines, financeMonth]);

  useEffect(() => {
    const year = Number(financeHistory.activeMonth.slice(0, 4));
    if (!Number.isNaN(year)) {
      setFinanceYear(year);
    }
  }, [financeHistory.activeMonth]);

  const availableYears = useMemo(() => {
    return Array.from(new Set(financeHistory.months.map((month) => month.slice(0, 4)))).sort(
      (a, b) => Number(a) - Number(b),
    );
  }, [financeHistory.months]);

  const visibleMonths = useMemo(() => {
    return Array.from({ length: 12 }, (_, index) => {
      const monthKey = `${financeYear}-${String(index + 1).padStart(2, "0")}`;
      return {
        monthKey,
        label: new Date(`${monthKey}-01`).toLocaleDateString("en-IN", { month: "short" }),
        hasData: financeHistory.months.includes(monthKey),
      };
    });
  }, [financeHistory.months, financeYear]);

  const canGoPrevYear = financeYear > Number(availableYears[0] ?? financeYear);
  const canGoNextYear = financeYear < Number(availableYears[availableYears.length - 1] ?? financeYear);

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

      <Card className="border-border/50 bg-gradient-to-br from-card to-card/60 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-primary" /> Finance View
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-xl border border-primary/10 bg-background/60 p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <div>
                <div className="text-sm font-semibold text-foreground">Monthly spend summary</div>
                <div className="text-xs text-muted-foreground">Review maintenance costs across the machine workspace</div>
              </div>
              <div className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-primary">
                Workspace view
              </div>
            </div>
            <div className="rounded-lg border border-border/40 bg-card/70 p-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">Selected month</div>
                  <div className="text-sm font-semibold text-foreground">
                    {new Date(`${financeHistory.activeMonth}-01`).toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-muted-foreground">Total spend</div>
                  <div className="text-sm font-semibold text-primary">{formatCurrency(financeHistory.monthTotal)}</div>
                </div>
              </div>
              <div className="mt-3 space-y-2">
                {financeHistory.monthEntries.length ? (
                  financeHistory.monthEntries.map((entry) => (
                    <div key={`${entry.date}-${entry.machineName}`} className="flex items-center justify-between rounded-lg border border-border/40 bg-card/70 px-2 py-2 text-sm">
                      <div>
                        <div className="font-medium text-foreground">{entry.machineName}</div>
                        <div className="text-xs text-muted-foreground">{entry.notes}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-foreground">{formatCurrency(entry.cost)}</div>
                        <div className="text-xs text-muted-foreground">{entry.date}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-muted-foreground">No maintenance costs recorded for this month.</div>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-primary/10 bg-background/60 p-3">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="text-sm font-semibold text-foreground">Historical expense calendar</div>
                <div className="text-xs text-muted-foreground">Browse spend for any prior month or year in the workspace history</div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => setFinanceYear((year) => year - 1)}
                  disabled={!canGoPrevYear}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="min-w-20 text-center text-sm font-semibold text-foreground">{financeYear}</div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => setFinanceYear((year) => year + 1)}
                  disabled={!canGoNextYear}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {visibleMonths.map(({ monthKey, label, hasData }) => {
                const isActive = monthKey === financeHistory.activeMonth;
                return (
                  <button
                    key={monthKey}
                    type="button"
                    onClick={() => hasData && setFinanceMonth(monthKey)}
                    disabled={!hasData}
                    className={cn(
                      "rounded-lg border px-2 py-2 text-left text-xs font-medium transition",
                      hasData
                        ? isActive
                          ? "border-primary bg-primary/15 text-primary shadow-sm shadow-primary/10"
                          : "border-border/50 bg-background/70 text-foreground hover:border-primary/30 hover:bg-primary/5"
                        : "cursor-not-allowed border-border/40 bg-muted/20 text-muted-foreground",
                    )}
                  >
                    <div className="font-medium">{label}</div>
                    <div className="mt-1 text-[10px] uppercase tracking-wide">{hasData ? "Recorded" : "No data"}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((m) => (
          <Card
            key={m.id}
            className="group h-full cursor-pointer border-border/50 bg-gradient-to-br from-card to-card/60 backdrop-blur-md transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10"
            onClick={() => navigate({ to: "/machines/$id", params: { id: m.id } })}
          >
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <CardTitle className="text-base">{m.name}</CardTitle>
                  <p className="mt-0.5 font-mono text-xs text-muted-foreground">{m.machineId}</p>
                </div>
                <div className="flex items-center gap-1">
                  <StatusBadge status={m.status} />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={(event) => handleDeleteMachine(event, m.id, m.name)}
                    aria-label={`Delete ${m.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
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
              <div className="rounded-md border border-border/50 bg-background/40 px-2.5 py-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Maintenance in</span>
                  <span className="font-semibold text-foreground">{estimateMaintenanceDays(m.healthScore)} days</span>
                </div>
                <div className="mt-1 text-[11px] text-muted-foreground">
                  {maintenanceHint(m.healthScore)}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-3">
                <Metric label="Temp" v={`${Math.round(m.temperature)}°`} />
                <Metric label="Vibration" v={`${Number(m.vibration.toFixed(1))}`} />
                <Metric label="Motor" v={`${Number(m.motorCurrent.toFixed(1))}A`} />
                <Metric label="Humidity" v={`${Math.round(m.humidity)}%`} />
                <Metric label="Run Hrs" v={`${m.runningHours}`} />
                <Metric label="Load" v={`${m.power}kW`} />
                <Metric label="RPM" v={`${m.rpm}`} />
              </div>
            </CardContent>
          </Card>
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

function estimateMaintenanceDays(healthScore: number) {
  if (healthScore >= 90) return 24;
  if (healthScore >= 80) return 18;
  if (healthScore >= 70) return 12;
  if (healthScore >= 60) return 8;
  if (healthScore >= 50) return 5;
  if (healthScore >= 40) return 3;
  return 1;
}

function maintenanceHint(healthScore: number) {
  if (healthScore >= 85) return "Operating normally — service remains on schedule";
  if (healthScore >= 70) return "Monitor closely and plan preventive maintenance soon";
  if (healthScore >= 50) return "Maintenance window is approaching";
  return "Immediate attention recommended";
}
