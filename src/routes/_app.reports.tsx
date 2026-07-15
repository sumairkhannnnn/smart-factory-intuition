import { createFileRoute } from "@tanstack/react-router";
import { Download, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { machines } from "@/lib/mockData";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/reports")({
  component: ReportsPage,
});

function downloadCsv() {
  const header = [
    "id",
    "name",
    "section",
    "temperature",
    "vibration",
    "healthScore",
    "status",
    "runningHours",
  ];
  const rows = machines.map((m) =>
    [m.id, m.name, m.section, m.temperature, m.vibration, m.healthScore, m.status, m.runningHours].join(
      ",",
    ),
  );
  const blob = new Blob([header.join(",") + "\n" + rows.join("\n")], {
    type: "text/csv",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "smartpredict-report.csv";
  a.click();
  URL.revokeObjectURL(url);
  toast.success("CSV downloaded");
}

function downloadPdf() {
  const html = `<!doctype html><html><head><title>SmartPredict Report</title>
  <style>body{font-family:system-ui;padding:24px}h1{color:#2563eb}table{width:100%;border-collapse:collapse;margin-top:16px}th,td{border:1px solid #ddd;padding:6px 8px;font-size:12px;text-align:left}th{background:#f1f5f9}</style>
  </head><body><h1>SmartPredict AI — Machine Report</h1>
  <p>Generated ${new Date().toLocaleString()}</p>
  <table><thead><tr><th>ID</th><th>Name</th><th>Section</th><th>Health</th><th>Status</th><th>Hours</th></tr></thead><tbody>
  ${machines
    .map(
      (m) =>
        `<tr><td>${m.id}</td><td>${m.name}</td><td>${m.section}</td><td>${m.healthScore}%</td><td>${m.status}</td><td>${m.runningHours}</td></tr>`,
    )
    .join("")}
  </tbody></table></body></html>`;
  const w = window.open("", "_blank");
  if (!w) return;
  w.document.write(html);
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 400);
}

function ReportsPage() {
  const totalDowntime = machines.reduce((a, m) => a + (100 - m.healthScore) * 0.4, 0);
  const monthlyCost = machines.reduce((a, m) => a + (100 - m.healthScore) * 42, 0);
  const totalEnergy = machines.reduce((a, m) => a + m.motorCurrent * m.runningHours * 0.001, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Reports</h1>
          <p className="text-sm text-muted-foreground">Performance, downtime, and cost summaries</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={downloadCsv}>
            <Download className="mr-2 h-4 w-4" /> CSV
          </Button>
          <Button onClick={downloadPdf}>
            <FileText className="mr-2 h-4 w-4" /> PDF
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Stat label="Total Downtime (h)" value={totalDowntime.toFixed(0)} />
        <Stat label="Monthly Cost ($)" value={monthlyCost.toFixed(0)} />
        <Stat label="Energy Used (kWh)" value={totalEnergy.toFixed(0)} />
        <Stat label="Failure Events" value={machines.filter((m) => m.status === "critical").length.toString()} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Machine Performance Summary</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Section</TableHead>
                <TableHead className="text-right">Hours</TableHead>
                <TableHead className="text-right">Health</TableHead>
                <TableHead className="text-right">Failure Prob</TableHead>
                <TableHead className="text-right">Est. Cost ($)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {machines.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="font-mono text-xs">{m.id}</TableCell>
                  <TableCell>{m.name}</TableCell>
                  <TableCell className="text-muted-foreground">{m.section}</TableCell>
                  <TableCell className="text-right tabular-nums">{m.runningHours}</TableCell>
                  <TableCell className="text-right tabular-nums">{m.healthScore}%</TableCell>
                  <TableCell className="text-right tabular-nums">{m.failureProbability}%</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {((100 - m.healthScore) * 42).toFixed(0)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="text-xs font-medium text-muted-foreground">{label}</div>
        <div className="mt-1 text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}
