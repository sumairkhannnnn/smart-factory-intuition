import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { generateSeries, machines } from "@/lib/mockData";

export const Route = createFileRoute("/_app/analytics")({
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const health = generateSeries(78, 15, 30, 11);
  const temp = generateSeries(72, 18, 30, 12);
  const energy = Array.from({ length: 12 }).map((_, i) => ({
    time: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][i],
    kWh: 3800 + Math.round(Math.sin(i) * 500 + i * 40),
  }));
  const downtime = Array.from({ length: 12 }).map((_, i) => ({
    time: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][i],
    hours: 4 + Math.round(Math.abs(Math.sin(i * 1.7)) * 12),
  }));
  const failurePred = generateSeries(22, 20, 30, 21);
  const maintenance = Array.from({ length: 12 }).map((_, i) => ({
    time: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][i],
    planned: 8 + (i % 4),
    unplanned: 2 + (i % 3),
  }));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
        <p className="text-sm text-muted-foreground">
          Long-term trends across {machines.length} monitored assets
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Machine Health Trend">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={health}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="time" fontSize={10} stroke="var(--color-muted-foreground)" />
              <YAxis fontSize={10} stroke="var(--color-muted-foreground)" />
              <Tooltip contentStyle={tt} />
              <Line dataKey="value" stroke="var(--color-primary)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Temperature Trend">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={temp}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="time" fontSize={10} stroke="var(--color-muted-foreground)" />
              <YAxis fontSize={10} stroke="var(--color-muted-foreground)" />
              <Tooltip contentStyle={tt} />
              <Area
                dataKey="value"
                stroke="var(--color-warning)"
                fill="var(--color-warning)"
                fillOpacity={0.25}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Energy Consumption (kWh)">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={energy}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="time" fontSize={10} stroke="var(--color-muted-foreground)" />
              <YAxis fontSize={10} stroke="var(--color-muted-foreground)" />
              <Tooltip contentStyle={tt} />
              <Bar dataKey="kWh" fill="var(--color-info)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Failure Prediction Trend (%)">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={failurePred}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="time" fontSize={10} stroke="var(--color-muted-foreground)" />
              <YAxis fontSize={10} stroke="var(--color-muted-foreground)" />
              <Tooltip contentStyle={tt} />
              <Line
                dataKey="value"
                stroke="var(--color-destructive)"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Downtime Analysis (h)">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={downtime}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="time" fontSize={10} stroke="var(--color-muted-foreground)" />
              <YAxis fontSize={10} stroke="var(--color-muted-foreground)" />
              <Tooltip contentStyle={tt} />
              <Bar dataKey="hours" fill="var(--color-destructive)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Monthly Maintenance">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={maintenance}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="time" fontSize={10} stroke="var(--color-muted-foreground)" />
              <YAxis fontSize={10} stroke="var(--color-muted-foreground)" />
              <Tooltip contentStyle={tt} />
              <Legend />
              <Bar dataKey="planned" fill="var(--color-success)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="unplanned" fill="var(--color-warning)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}

const tt = {
  background: "var(--color-popover)",
  border: "1px solid var(--color-border)",
  borderRadius: 8,
};

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="h-64">{children}</CardContent>
    </Card>
  );
}
