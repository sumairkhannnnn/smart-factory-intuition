import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { BatteryCharging, Clock3, Droplets, Leaf, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";
import { useMachines } from "@/lib/store";

export const Route = createFileRoute("/_app/sustainability")({
  component: SustainabilityPage,
});

function SustainabilityPage() {
  const machines = useMachines();

  const metrics = useMemo(() => {
    const totalRuntimeHours = machines.reduce((sum, machine) => sum + machine.runningHours, 0);
    const totalPowerUsage = machines.reduce((sum, machine) => sum + machine.power * 1.4, 0);
    const totalWaterUsage = machines.reduce((sum, machine) => sum + machine.runningHours * 0.18 * 1000, 0);
    const totalWaste = machines.reduce(
      (sum, machine) => sum + Math.max(0, machine.healthScore < 70 ? 1.4 : 0.6),
      0,
    );
    const co2Emitted = Math.round(totalPowerUsage * 0.47 + totalWaste * 2.8);
    const averageHealth = machines.length
      ? Math.round(machines.reduce((sum, machine) => sum + machine.healthScore, 0) / machines.length)
      : 0;

    return {
      co2Emitted,
      runtimeHours: Math.round(totalRuntimeHours / 24),
      waterUsage: Number(totalWaterUsage.toFixed(1)),
      powerUsage: Number(totalPowerUsage.toFixed(1)),
      wasteGenerated: Number(totalWaste.toFixed(1)),
      averageHealth,
    };
  }, [machines]);

  const machineChart = machines.slice(0, 8).map((machine) => ({
    name: machine.name,
    value: Math.max(10, Math.round(machine.power * 0.8 + machine.healthScore * 0.2)),
  }));

  const machineSustainability = machines.map((machine) => ({
    id: machine.id,
    name: machine.name,
    section: machine.section,
    co2: Math.round(machine.power * 1.4 * 0.47 + (machine.healthScore < 70 ? 1.4 : 0.6) * 2.8),
    runtimeHours: Math.max(1, Math.round(machine.runningHours / 24)),
    waterUsage: Number((machine.runningHours * 0.18 * 1000 / 24).toFixed(1)),
    powerUsage: Number((machine.power * 1.4).toFixed(1)),
    wasteGenerated: Number((machine.healthScore < 70 ? 1.4 : 0.6).toFixed(1)),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Sustainability Workspace</h1>
        <p className="text-sm text-muted-foreground">
          Monitor environmental impact, resource use, and operational efficiency from the factory workspace.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard title="CO₂ emitted" value={`${metrics.co2Emitted} kg`} icon={Leaf} accent="text-success" />
        <MetricCard title="Runtime" value={`${metrics.runtimeHours} hrs`} icon={Clock3} accent="text-info" />
        <MetricCard title="Water usage" value={`${metrics.waterUsage} L`} icon={Droplets} accent="text-primary" />
        <MetricCard title="Power usage" value={`${metrics.powerUsage} kWh`} icon={BatteryCharging} accent="text-warning" />
        <MetricCard title="Waste generated" value={`${metrics.wasteGenerated} kg`} icon={Trash2} accent="text-destructive" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="border-border/50 bg-gradient-to-br from-card to-card/60 backdrop-blur-md">
          <CardHeader>
            <CardTitle>Energy footprint by machine</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={machineChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="name" fontSize={10} stroke="var(--color-muted-foreground)" angle={-20} textAnchor="end" />
                <YAxis fontSize={10} stroke="var(--color-muted-foreground)" />
                <Tooltip
                  contentStyle={{
                    background: "var(--color-popover)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 8,
                  }}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {machineChart.map((entry, index) => (
                    <Cell
                      key={`${entry.name}-${index}`}
                      fill={index % 2 === 0 ? "var(--color-info)" : "var(--color-success)"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-gradient-to-br from-card to-card/60 backdrop-blur-md">
          <CardHeader>
            <CardTitle>Operational sustainability notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div className="rounded-lg border border-border/50 bg-card/40 p-3">
              <div className="font-medium text-foreground">Fleet health outlook</div>
              <p className="mt-1">Average machine health is {metrics.averageHealth}%.</p>
            </div>
            <div className="rounded-lg border border-border/50 bg-card/40 p-3">
              <div className="font-medium text-foreground">Recommended focus</div>
              <p className="mt-1">Prioritize preventive maintenance and energy-efficient scheduling to reduce carbon load and waste.</p>
            </div>
            <div className="rounded-lg border border-border/50 bg-card/40 p-3">
              <div className="font-medium text-foreground">Business impact</div>
              <p className="mt-1">Lowering power and water demand can improve efficiency while supporting cleaner operations.</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50 bg-gradient-to-br from-card to-card/60 backdrop-blur-md">
        <CardHeader>
          <CardTitle>Machine-by-machine sustainability</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-border/50 text-left text-muted-foreground">
                <th className="px-2 py-2">Machine</th>
                <th className="px-2 py-2">Section</th>
                <th className="px-2 py-2">CO₂</th>
                <th className="px-2 py-2">Runtime</th>
                <th className="px-2 py-2">Water</th>
                <th className="px-2 py-2">Power</th>
                <th className="px-2 py-2">Waste</th>
              </tr>
            </thead>
            <tbody>
              {machineSustainability.map((machine) => (
                <tr key={machine.id} className="border-b border-border/40 text-foreground">
                  <td className="px-2 py-2 font-medium">{machine.name}</td>
                  <td className="px-2 py-2 text-muted-foreground">{machine.section}</td>
                  <td className="px-2 py-2">{machine.co2} kg</td>
                  <td className="px-2 py-2">{machine.runtimeHours} hrs</td>
                  <td className="px-2 py-2">{machine.waterUsage} L</td>
                  <td className="px-2 py-2">{machine.powerUsage} kWh</td>
                  <td className="px-2 py-2">{machine.wasteGenerated} kg</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

function MetricCard({ title, value, icon: Icon, accent }: { title: string; value: string; icon: React.ComponentType<{ className?: string }>; accent: string }) {
  return (
    <Card className="border-border/50 bg-gradient-to-br from-card to-card/60 backdrop-blur-md">
      <CardContent className="flex items-center justify-between p-4">
        <div>
          <div className="text-sm text-muted-foreground">{title}</div>
          <div className="mt-1 text-xl font-semibold text-foreground">{value}</div>
        </div>
        <div className={`rounded-lg border border-border/50 bg-background/40 p-2 ${accent}`}>
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );
}
