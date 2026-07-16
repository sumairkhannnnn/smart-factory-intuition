import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Cog,
  Wrench,
  Plus,
  DollarSign,
  Calendar,
  Zap,
  ArrowRight,
  Lightbulb,
  TrendingUp,
  ShieldCheck,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { useMachines, totalExpenses } from "@/lib/store";
import { StatusBadge } from "@/components/status-badge";
import { AddMachineDialog } from "@/components/add-machine-dialog";
import { cn } from "@/lib/utils";
import { getUser } from "@/lib/auth";

export const Route = createFileRoute("/_app/dashboard")({
  component: Dashboard,
});

function useCounter(target: number, ms = 700) {
  const [v, setV] = useState(0);
  useEffect(() => {
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / ms);
      setV(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return v;
}

function KpiCard({
  label,
  value,
  icon: Icon,
  accent,
  prefix = "",
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
  prefix?: string;
}) {
  const c = useCounter(value);
  return (
    <Card className="group relative overflow-hidden border-border/50 bg-gradient-to-br from-card to-card/60 backdrop-blur-md transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/10">
      <div className={cn("absolute inset-x-0 top-0 h-0.5", accent)} />
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-xs font-medium text-muted-foreground">{label}</div>
            <div className="mt-1 text-3xl font-bold tabular-nums">
              {prefix}
              {c.toLocaleString()}
            </div>
          </div>
          <div className={cn("rounded-lg border p-2", accent, "bg-opacity-10")}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Dashboard() {
  const machines = useMachines();
  const [open, setOpen] = useState(false);
  const currentUser = getUser();
  const isOwner = currentUser?.role === "owner";

  const formatCurrency = (value: number) => `₹${Math.round(value).toLocaleString("en-IN")}`;

  const s = useMemo(() => {
    return {
      total: machines.length,
      healthy: machines.filter((m) => m.status === "healthy").length,
      warning: machines.filter((m) => m.status === "warning1" || m.status === "warning2").length,
      critical: machines.filter((m) => m.status === "critical").length,
      off: machines.filter((m) => m.status === "off").length,
    };
  }, [machines]);

  const exp = useMemo(() => totalExpenses(machines), [machines]);

  const healthTrend = Array.from({ length: 24 }).map((_, i) => ({
    time: `${String(i).padStart(2, "0")}:00`,
    value: Math.round(70 + Math.sin(i / 3) * 10 + Math.random() * 6),
  }));

  const expensePie = machines
    .filter((m) => m.maintenanceCost > 0)
    .slice(0, 6)
    .map((m, i) => ({
      name: m.name,
      value: m.maintenanceCost,
      color: [
        "#3b82f6",
        "#8b5cf6",
        "#10b981",
        "#f59e0b",
        "#ef4444",
        "#14b8a6",
      ][i % 6],
    }));


  const sustainability = useMemo(() => {
    const totalRuntimeHours = machines.reduce((sum, machine) => sum + machine.runningHours, 0);
    const totalPowerUsage = machines.reduce((sum, machine) => sum + machine.power * 1.4, 0);
    const totalWaterUsage = machines.reduce((sum, machine) => sum + machine.runningHours * 0.18, 0);
    const totalWaste = machines.reduce((sum, machine) => sum + Math.max(0, machine.healthScore < 70 ? 1.4 : 0.6), 0);
    const co2Emitted = Math.round(totalPowerUsage * 0.47 + totalWaste * 2.8);

    return {
      co2Emitted,
      runtimeHours: Math.round(totalRuntimeHours / 24),
      waterUsage: Number(totalWaterUsage.toFixed(1)),
      powerUsage: Number(totalPowerUsage.toFixed(1)),
      wasteGenerated: Number(totalWaste.toFixed(1)),
    };
  }, [machines]);

  const ownerInsights = useMemo(() => {
    const averageHealth = machines.length
      ? Math.round(machines.reduce((sum, m) => sum + m.healthScore, 0) / machines.length)
      : 0;
    const topCostMachine = [...machines].sort((a, b) => b.maintenanceCost - a.maintenanceCost)[0];
    const urgentMachines = machines.filter((m) => m.status === "critical" || m.status === "warning1" || m.status === "warning2").slice(0, 3);

    const recommendations = [] as Array<{ title: string; detail: string }>;

    if (s.critical > 0) {
      recommendations.push({
        title: "Prioritize critical assets",
        detail: `${s.critical} machines need urgent attention to reduce downtime risk and protect daily output.`,
      });
    }

    if (averageHealth < 75) {
      recommendations.push({
        title: "Increase preventive maintenance",
        detail: "A lower fleet health score suggests more planned servicing would improve reliability and lower surprise breakdowns.",
      });
    }

    if (topCostMachine) {
      recommendations.push({
        title: "Review the costliest machines",
        detail: `${topCostMachine.name} is your highest-cost asset. Check its upkeep plan and spare-parts strategy to improve cost efficiency.`,
      });
    }

    if (urgentMachines.length > 0) {
      recommendations.push({
        title: "Tighten maintenance windows",
        detail: `Focus on ${urgentMachines.map((m) => m.name).join(", ")} this week to keep production stable and reduce sudden losses.`,
      });
    }

    if (!recommendations.length) {
      recommendations.push({
        title: "Keep the good momentum",
        detail: "Your fleet is performing well. Continue preventive checks and review small efficiency gains to strengthen output.",
      });
    }

    return { averageHealth, recommendations };
  }, [machines, s]);

  const greetingLabel = currentUser?.role === "owner" ? "Founder" : currentUser?.role === "supervisor" ? "Supervisor" : "User";
  const greetingName = currentUser?.name?.trim() || "Guest";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="bg-gradient-to-r from-primary via-info to-primary bg-clip-text text-3xl font-bold tracking-tight text-transparent">
            {isOwner ? "Executive Command Center" : "Shift Operations Center"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isOwner
              ? "Strategic visibility over assets, cost, and uptime for leadership."
              : "Real-time floor visibility for supervisors managing daily production health."}
          </p>
        </div>
        {isOwner ? (
          <Button
            onClick={() => setOpen(true)}
            className="bg-gradient-to-r from-primary to-info shadow-lg shadow-primary/25"
          >
            <Plus className="h-4 w-4" /> Add Machine
          </Button>
        ) : (
          <Button variant="outline" className="border-primary/30 bg-card/70">
            <Activity className="mr-2 h-4 w-4" /> Team Shift Review
          </Button>
        )}
      </div>

      <div className="flex items-center justify-center py-2">
        <h2 className="text-center text-3xl font-black tracking-tight text-foreground sm:text-4xl">
          Hello, <span className="bg-gradient-to-r from-primary via-info to-primary bg-clip-text text-transparent">{greetingName}</span>
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <KpiCard label="Total Machines" value={s.total} icon={Cog} accent="bg-info text-info border-info/40" />
        <KpiCard label="Very Good Condition" value={s.healthy} icon={CheckCircle2} accent="bg-success text-success border-success/40" />
        <KpiCard label="Warning" value={s.warning} icon={Activity} accent="bg-warning text-warning border-warning/40" />
        <KpiCard label="Critical" value={s.critical} icon={AlertTriangle} accent="bg-destructive text-destructive border-destructive/40" />
        {isOwner ? (
          <>
            <KpiCard label="Total Expense" value={exp.lifetime} icon={DollarSign} accent="bg-primary text-primary border-primary/40" prefix="₹" />
            <KpiCard label="Monthly Expense" value={exp.month} icon={Calendar} accent="bg-primary text-primary border-primary/40" prefix="₹" />
          </>
        ) : (
          <>
            <div className="col-span-2 md:col-span-1 lg:col-span-2" />
          </>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        <Card className="border-border/50 bg-gradient-to-br from-card to-card/60 backdrop-blur-md lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-info" /> Fleet Health Trend (24h)
            </CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={healthTrend}>
                <defs>
                  <linearGradient id="hg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-info)" stopOpacity={0.6} />
                    <stop offset="100%" stopColor="var(--color-info)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="time" stroke="var(--color-muted-foreground)" fontSize={11} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    background: "var(--color-popover)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 8,
                  }}
                />
                <Area type="monotone" dataKey="value" stroke="var(--color-info)" fill="url(#hg)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {isOwner ? (
          <>
            <Card className="border-border/50 bg-gradient-to-br from-card to-card/60 backdrop-blur-md">
              <CardHeader>
                <CardTitle>Expenses by Machine</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {expensePie.length ? (
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={expensePie} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={3}>
                          {expensePie.map((e) => <Cell key={e.name} fill={e.color} />)}
                        </Pie>
                        <Legend />
                        <Tooltip
                          contentStyle={{
                            background: "var(--color-popover)",
                            border: "1px solid var(--color-border)",
                            borderRadius: 8,
                          }}
                          formatter={(v: number) => `₹${Math.round(v).toLocaleString("en-IN")}`}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="flex h-56 items-center justify-center text-sm text-muted-foreground">
                    No expenses yet
                  </div>
                )}

              </CardContent>
            </Card>

            <Card className="border-border/50 bg-gradient-to-br from-card to-card/60 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-primary" /> Founder Guidance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    Fleet health outlook
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Average health is <span className="font-semibold text-foreground">{ownerInsights.averageHealth}%</span>. This is a strong signal to focus on preventive maintenance and cost control.
                  </p>
                </div>

                <div className="space-y-2">
                  {ownerInsights.recommendations.map((tip) => (
                    <div key={tip.title} className="rounded-lg border border-border/50 bg-card/40 p-3">
                      <div className="flex items-start gap-2">
                        <ShieldCheck className="mt-0.5 h-4 w-4 flex-shrink-0 text-success" />
                        <div>
                          <div className="text-sm font-semibold text-foreground">{tip.title}</div>
                          <p className="text-sm text-muted-foreground">{tip.detail}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        ) : null}
      </div>

      <Card className="border-border/50 bg-gradient-to-br from-card to-card/60 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-success" /> Sustainability Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            <div className="rounded-lg border border-border/50 bg-card/40 p-3">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">CO₂ emitted</div>
              <div className="mt-1 text-xl font-semibold text-foreground">{sustainability.co2Emitted} kg</div>
            </div>
            <div className="rounded-lg border border-border/50 bg-card/40 p-3">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">Runtime</div>
              <div className="mt-1 text-xl font-semibold text-foreground">{sustainability.runtimeHours} hrs</div>
            </div>
            <div className="rounded-lg border border-border/50 bg-card/40 p-3">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">Water usage</div>
              <div className="mt-1 text-xl font-semibold text-foreground">{sustainability.waterUsage} m³</div>
            </div>
            <div className="rounded-lg border border-border/50 bg-card/40 p-3">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">Power usage</div>
              <div className="mt-1 text-xl font-semibold text-foreground">{sustainability.powerUsage} kWh</div>
            </div>
            <div className="rounded-lg border border-border/50 bg-card/40 p-3">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">Waste generated</div>
              <div className="mt-1 text-xl font-semibold text-foreground">{sustainability.wasteGenerated} kg</div>
            </div>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            This overview helps {isOwner ? "founders" : "supervisors"} monitor environmental performance alongside uptime and maintenance activity.
          </p>
        </CardContent>
      </Card>

      <Card className="border-border/50 bg-gradient-to-br from-card to-card/60 backdrop-blur-md">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-4 w-4 text-warning" /> Machines Needing Attention
          </CardTitle>
          <Link to="/machines" className="text-xs text-primary hover:underline inline-flex items-center gap-1">
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </CardHeader>
        <CardContent className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
          {machines
            .filter((m) => m.status !== "healthy" && m.status !== "good")
            .slice(0, 6)
            .map((m) => (
              <Link
                key={m.id}
                to="/machines/$id"
                params={{ id: m.id }}
                className="group flex items-center justify-between rounded-lg border border-border/60 bg-card/40 p-3 backdrop-blur transition hover:border-primary/50 hover:bg-accent/30"
              >
                <div>
                  <div className="text-sm font-medium">{m.name}</div>
                  <div className="text-xs text-muted-foreground">{m.section}</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-xs text-muted-foreground">
                    Health <span className="font-semibold text-foreground">{m.healthScore}%</span>
                  </div>
                  <StatusBadge status={m.status} />
                </div>
              </Link>
            ))}
          {machines.filter((m) => m.status !== "healthy" && m.status !== "good").length === 0 && (
            <div className="col-span-full py-6 text-center text-sm text-muted-foreground">
              All machines running healthy 🎉
            </div>
          )}
        </CardContent>
      </Card>

      <AddMachineDialog open={open} onOpenChange={setOpen} />
    </div>
  );
}
