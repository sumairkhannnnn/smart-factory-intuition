export type MachineStatus = "healthy" | "warning" | "critical";

export interface Machine {
  id: string;
  name: string;
  section: string;
  temperature: number;
  vibration: number;
  humidity: number;
  motorCurrent: number;
  runningHours: number;
  rpm: number;
  load: number;
  healthScore: number;
  failureProbability: number;
  status: MachineStatus;
  remainingDays: number;
  lastMaintenance: string;
  nextMaintenance: string;
}

export interface AlertItem {
  id: string;
  machineId: string;
  machineName: string;
  type: string;
  severity: "critical" | "warning" | "info";
  message: string;
  time: string;
}

export interface MaintenanceEvent {
  id: string;
  machineId: string;
  machineName: string;
  technician: string;
  date: string;
  status: "scheduled" | "completed" | "in-progress";
  task: string;
}

const sections = [
  "Weaving Line A",
  "Weaving Line B",
  "Dyeing Unit",
  "Spinning Section",
  "Auto Press Bay",
  "CNC Bay",
  "Assembly Line",
  "Packaging",
];

const machineTypes = [
  "Loom",
  "Spinner",
  "Dyeing Vat",
  "Press",
  "CNC Mill",
  "Lathe",
  "Conveyor",
  "Robotic Arm",
];

function seeded(seed: number) {
  let x = seed;
  return () => {
    x = (x * 9301 + 49297) % 233280;
    return x / 233280;
  };
}

function statusFromScore(score: number): MachineStatus {
  if (score >= 75) return "healthy";
  if (score >= 50) return "warning";
  return "critical";
}

export const machines: Machine[] = Array.from({ length: 20 }).map((_, i) => {
  const r = seeded(i + 7);
  const health = Math.round(40 + r() * 58);
  const temp = +(50 + r() * 55).toFixed(1);
  const vib = +(1 + r() * 8).toFixed(2);
  const status = statusFromScore(health);
  const idNum = String(101 + i).padStart(3, "0");
  return {
    id: `M-${idNum}`,
    name: `${machineTypes[i % machineTypes.length]} ${idNum}`,
    section: sections[i % sections.length],
    temperature: temp,
    vibration: vib,
    humidity: +(35 + r() * 40).toFixed(1),
    motorCurrent: +(4 + r() * 18).toFixed(2),
    runningHours: Math.round(500 + r() * 8500),
    rpm: Math.round(600 + r() * 2400),
    load: Math.round(30 + r() * 65),
    healthScore: health,
    failureProbability: Math.round((100 - health) * (0.7 + r() * 0.4)),
    status,
    remainingDays: Math.max(1, Math.round(health * 1.5 - r() * 20)),
    lastMaintenance: new Date(Date.now() - Math.round(r() * 60) * 86400000)
      .toISOString()
      .slice(0, 10),
    nextMaintenance: new Date(Date.now() + Math.round(r() * 30) * 86400000)
      .toISOString()
      .slice(0, 10),
  };
});

export const alerts: AlertItem[] = machines
  .flatMap((m): AlertItem[] => {
    const out: AlertItem[] = [];
    if (m.temperature > 90)
      out.push({
        id: `${m.id}-t`,
        machineId: m.id,
        machineName: m.name,
        type: "High Temperature",
        severity: "critical",
        message: `${m.name} temperature is ${m.temperature}°C (threshold 90°C)`,
        time: "2m ago",
      });
    if (m.vibration > 6)
      out.push({
        id: `${m.id}-v`,
        machineId: m.id,
        machineName: m.name,
        type: "High Vibration",
        severity: "critical",
        message: `${m.name} vibration ${m.vibration} mm/s exceeds limit`,
        time: "5m ago",
      });
    if (m.motorCurrent > 18)
      out.push({
        id: `${m.id}-c`,
        machineId: m.id,
        machineName: m.name,
        type: "Motor Overload",
        severity: "warning",
        message: `${m.name} motor drawing ${m.motorCurrent}A`,
        time: "12m ago",
      });
    if (m.healthScore < 60)
      out.push({
        id: `${m.id}-e`,
        machineId: m.id,
        machineName: m.name,
        type: "Low Efficiency",
        severity: "warning",
        message: `${m.name} health score dropped to ${m.healthScore}%`,
        time: "30m ago",
      });
    return out;
  })
  .slice(0, 24);

export const maintenance: MaintenanceEvent[] = machines.slice(0, 12).map((m, i) => {
  const offset = i - 4;
  return {
    id: `MT-${i + 1}`,
    machineId: m.id,
    machineName: m.name,
    technician: ["Ravi Kumar", "Amit Shah", "Priya Patel", "John Doe"][i % 4],
    date: new Date(Date.now() + offset * 86400000).toISOString().slice(0, 10),
    status: offset < 0 ? "completed" : offset === 0 ? "in-progress" : "scheduled",
    task: ["Bearing replacement", "Belt tension check", "Lubrication", "Sensor calibration"][i % 4],
  };
});

// Time series generator
export function generateSeries(base: number, spread: number, points = 24, seed = 1) {
  const r = seeded(seed);
  return Array.from({ length: points }).map((_, i) => ({
    time: `${String(i).padStart(2, "0")}:00`,
    value: +(base + (r() - 0.5) * spread).toFixed(2),
  }));
}

export function getMachine(id: string) {
  return machines.find((m) => m.id === id);
}

export function summary() {
  return {
    total: machines.length,
    healthy: machines.filter((m) => m.status === "healthy").length,
    warning: machines.filter((m) => m.status === "warning").length,
    critical: machines.filter((m) => m.status === "critical").length,
    maintenanceDueToday: maintenance.filter(
      (m) => m.date === new Date().toISOString().slice(0, 10),
    ).length,
    alerts: alerts.filter((a) => a.severity === "critical").length,
  };
}
