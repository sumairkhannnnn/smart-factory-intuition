// LocalStorage-backed machine store for Smart Factory Insights
import { useEffect, useState } from "react";

export type MachineStatus =
  | "healthy"
  | "good"
  | "warning1"
  | "warning2"
  | "critical"
  | "off";

export interface BugReport {
  id: string;
  title: string;
  reportedAt: string;
  resolved: boolean;
}

export interface MaintenanceRecord {
  id: string;
  date: string;
  engineer: string;
  notes: string;
  cost: number;
  parts: string;
  timeTaken: string;
}

export interface Machine {
  id: string;
  name: string;
  machineId: string;
  type: string;
  section: string;
  manufacturer: string;
  installedOn: string;
  lastMaintenance: string;
  healthUpdatedAt?: string;
  serviceIntervalDays: number;
  status: MachineStatus;

  // Live sensor snapshot (mock)
  temperature: number;
  vibration: number;
  motorCurrent: number;
  power: number;
  runningHours: number;
  rpm: number;
  humidity: number;

  healthScore: number;
  failureProbability: number;
  confidence: number;
  remainingDays: number;

  maintenanceCost: number;
  history: MaintenanceRecord[];
  bugs: BugReport[];
  function?: string;
}

const KEY = "sfi_machines_v1";

const TYPES = ["Loom", "Spinner", "Dyeing Vat", "Press", "CNC Mill", "Lathe", "Conveyor", "Robotic Arm"];
const SECTIONS = ["Weaving Line A", "Weaving Line B", "Dyeing Unit", "Spinning", "CNC Bay", "Assembly", "Packaging"];
const MANUS = ["Siemens", "ABB", "Toshiba", "Fanuc", "Bosch", "Mitsubishi"];

function rand(seed: number) {
  let x = seed;
  return () => {
    x = (x * 9301 + 49297) % 233280;
    return x / 233280;
  };
}

function roundConditionValue(value: number, digits = 1) {
  return Number(value.toFixed(digits));
}

function statusFromScore(score: number): MachineStatus {
  if (score > 90) return "healthy";
  if (score >= 75) return "good";
  if (score >= 60) return "warning1";
  if (score >= 45) return "warning2";
  return "critical";
}

function resetMachineAfterMaintenance(machine: Machine): Machine {
  return {
    ...machine,
    status: "good",
    healthScore: 100,
    failureProbability: 2,
    confidence: 98,
    remainingDays: 90,
    lastMaintenance: new Date().toISOString().slice(0, 10),
    healthUpdatedAt: new Date().toISOString(),
    temperature: 55,
    vibration: 1.8,
    motorCurrent: 8,
    humidity: 45,
    power: 10,
    rpm: 1200,
    maintenanceCost: machine.maintenanceCost,
    bugs: machine.bugs.map((b) => ({ ...b, resolved: true })),
  };
}

function deriveHealthScore(machine: Machine): number {
  const healthBaseline = machine.healthUpdatedAt ?? machine.lastMaintenance;
  const elapsedHours = Math.max(0, (Date.now() - new Date(healthBaseline).getTime()) / 3600000);
  const timePenalty = Number(Math.min(22, elapsedHours / 12).toFixed(2));
  const tempValue = roundConditionValue(machine.temperature, 1);
  const currentValue = roundConditionValue(machine.motorCurrent, 1);
  const humidityValue = roundConditionValue(machine.humidity, 1);
  const tempPenalty = Number(Math.max(0, (tempValue - 55) / 6).toFixed(2));
  const vibrationPenalty = Number(Math.max(0, (machine.vibration - 1.8) / 0.9).toFixed(2));
  const currentPenalty = Number(Math.max(0, (currentValue - 8) / 4).toFixed(2));
  const rpmPenalty = Number(Math.max(0, (machine.rpm - 1200) / 300).toFixed(2));
  const humidityPenalty = Number(Math.max(0, (humidityValue - 45) / 6).toFixed(2));
  const hoursPenalty = Number(Math.min(15, Math.max(0, machine.runningHours / 1500)).toFixed(2));
  const score = 100 - timePenalty - tempPenalty - vibrationPenalty - currentPenalty - rpmPenalty - humidityPenalty - hoursPenalty;
  return Math.max(0, Math.round(score));
}

function hydrateMachineHealth(machine: Machine): Machine {
  if (machine.status === "off") return machine;

  const healthUpdatedAt = machine.healthUpdatedAt ?? (machine.healthScore >= 99 ? new Date().toISOString() : machine.lastMaintenance);
  const healthScore = deriveHealthScore({ ...machine, healthUpdatedAt });

  const nextStatus = statusFromScore(healthScore);

  return {
    ...machine,
    healthUpdatedAt,
    healthScore,
    status: nextStatus,
    failureProbability: Math.max(2, Math.round((100 - healthScore) * 0.9)),
    confidence: Math.max(70, Math.round(98 - (100 - healthScore) * 0.25)),
    remainingDays: Math.max(1, Math.round(healthScore * 1.2 - Math.max(0, (Date.now() - new Date(machine.lastMaintenance).getTime()) / 86400000) * 1.5)),
  };
}

function seed(): Machine[] {
  return Array.from({ length: 20 }).map((_, i) => {
    const r = rand(i + 11);
    const health = Math.round(45 + r() * 55);
    const idNum = String(101 + i).padStart(3, "0");
    const type = TYPES[i % TYPES.length];
    const cost = Math.round(2000 + r() * 18000);
    return {
      id: `mc-${idNum}`,
      machineId: `M-${idNum}`,
      name: `${type} ${idNum}`,
      type,
      section: SECTIONS[i % SECTIONS.length],
      manufacturer: MANUS[i % MANUS.length],
      installedOn: new Date(Date.now() - Math.round(400 + r() * 1200) * 86400000).toISOString().slice(0, 10),
      lastMaintenance: new Date(Date.now() - Math.round(r() * 150) * 86400000).toISOString().slice(0, 10),
      healthUpdatedAt: new Date(Date.now() - Math.round(r() * 150) * 86400000).toISOString(),
      serviceIntervalDays: 90,
      status: statusFromScore(health),
      temperature: roundConditionValue(55 + r() * 45, 1),
      vibration: +(1 + r() * 8).toFixed(2),
      motorCurrent: roundConditionValue(4 + r() * 18, 1),
      power: +(5 + r() * 40).toFixed(1),
      runningHours: Math.round(500 + r() * 8500),
      rpm: Math.round(600 + r() * 2400),
      humidity: roundConditionValue(35 + r() * 40, 1),
      healthScore: health,
      failureProbability: Math.round((100 - health) * 0.9),
      confidence: Math.round(80 + r() * 18),
      remainingDays: Math.max(1, Math.round(health * 1.5 - r() * 20)),
      maintenanceCost: cost,
      function: `${type} operations`,
      history: [
        {
          id: `h-${i}-1`,
          date: new Date(Date.now() - Math.round(r() * 90) * 86400000).toISOString().slice(0, 10),
          engineer: ["Ravi Kumar", "Amit Shah", "Priya Patel"][i % 3],
          notes: "Routine inspection and lubrication",
          cost: Math.round(500 + r() * 2500),
          parts: "Grease, filter",
          timeTaken: `${1 + Math.round(r() * 4)}h`,
        },
      ],
      bugs: [],
    };
  });
}

export function loadMachines(): Machine[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Machine[];
      const hydrated = parsed.map(hydrateMachineHealth);
      localStorage.setItem(KEY, JSON.stringify(hydrated));
      return hydrated;
    }
    const s = seed();
    const hydrated = s.map(hydrateMachineHealth);
    localStorage.setItem(KEY, JSON.stringify(hydrated));
    return hydrated;
  } catch {
    const fallback = seed().map(hydrateMachineHealth);
    localStorage.setItem(KEY, JSON.stringify(fallback));
    return fallback;
  }
}

export function saveMachines(list: Machine[]) {
  const hydrated = list.map(hydrateMachineHealth);
  localStorage.setItem(KEY, JSON.stringify(hydrated));
  window.dispatchEvent(new Event("sfi:machines"));
}

export function useMachines() {
  const [list, setList] = useState<Machine[]>([]);
  useEffect(() => {
    const refresh = () => setList(loadMachines());
    refresh();
    const h = () => refresh();
    const interval = window.setInterval(refresh, 5000);
    window.addEventListener("sfi:machines", h);
    window.addEventListener("storage", h);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("sfi:machines", h);
      window.removeEventListener("storage", h);
    };
  }, []);
  return list;
}

export function addMachine(m: Omit<Machine, "history" | "bugs" | "healthScore" | "failureProbability" | "confidence" | "remainingDays" | "temperature" | "vibration" | "motorCurrent" | "power" | "runningHours" | "rpm" | "humidity" | "maintenanceCost"> & Partial<Machine>) {
  const list = loadMachines();
  const full: Machine = {
    temperature: 65,
    vibration: 2.4,
    motorCurrent: 8,
    power: 12,
    runningHours: 0,
    rpm: 1200,
    humidity: 45,
    healthScore: m.status === "critical" ? 40 : m.status === "warning1" || m.status === "warning2" ? 65 : 95,
    failureProbability: m.status === "critical" ? 92 : m.status === "warning1" || m.status === "warning2" ? 45 : 8,
    confidence: 90,
    remainingDays: m.status === "critical" ? 3 : 60,
    maintenanceCost: 0,
    history: [],
    bugs: [],
    ...m,
  } as Machine;
  saveMachines([full, ...list]);
}

export function updateMachine(id: string, patch: Partial<Machine>) {
  const list = loadMachines().map((m) => (m.id === id ? { ...m, ...patch } : m));
  saveMachines(list);
}

export function deleteMachine(id: string) {
  saveMachines(loadMachines().filter((m) => m.id !== id));
}

export function removeMachineHistoryEntry(machineId: string, historyId: string) {
  const list = loadMachines().map((machine) => {
    if (machine.id !== machineId) return machine;

    const entryToRemove = machine.history.find((entry) => entry.id === historyId);
    if (!entryToRemove) return machine;

    return {
      ...machine,
      history: machine.history.filter((entry) => entry.id !== historyId),
      maintenanceCost: Math.max(0, machine.maintenanceCost - entryToRemove.cost),
    };
  });

  saveMachines(list);
}

export function resetMaintenanceExpenses() {
  const list = loadMachines().map((machine) => ({
    ...machine,
    maintenanceCost: 0,
    history: machine.history.map((entry) => ({ ...entry, cost: 0 })),
  }));

  saveMachines(list);
}

export function addBug(id: string, title: string) {
  const list = loadMachines().map((m) =>
    m.id === id
      ? {
          ...m,
          bugs: [
            { id: `b-${Date.now()}`, title, reportedAt: new Date().toISOString(), resolved: false },
            ...m.bugs,
          ],
        }
      : m,
  );
  saveMachines(list);
}

export function toggleBug(id: string, bugId: string) {
  const list = loadMachines().map((m) =>
    m.id === id
      ? { ...m, bugs: m.bugs.map((b) => (b.id === bugId ? { ...b, resolved: !b.resolved } : b)) }
      : m,
  );
  saveMachines(list);
}

export function performMaintenance(id: string, rec: Omit<MaintenanceRecord, "id" | "date">) {
  const list = loadMachines();
  const nextList = list.map((m) => {
    if (m.id !== id) return m;
    const newRec: MaintenanceRecord = {
      id: `h-${Date.now()}`,
      date: new Date().toISOString().slice(0, 10),
      ...rec,
      cost: rec.cost || 0,
    };
    const reset = resetMachineAfterMaintenance(m);
    return {
      ...reset,
      lastMaintenance: newRec.date,
      maintenanceCost: m.maintenanceCost + newRec.cost,
      history: [newRec, ...m.history],
    };
  });

  window.localStorage.setItem(KEY, JSON.stringify(nextList));
  window.dispatchEvent(new Event("sfi:machines"));
  window.dispatchEvent(new Event("storage"));
}

export function statusLabel(s: MachineStatus) {
  return {
    healthy: "Very Good Condition",
    good: "Good Condition",
    warning1: "Warning",
    warning2: "Warning",
    critical: "Critical",
    off: "Power Off",
  }[s];
}

export function statusColor(s: MachineStatus) {
  return {
    healthy: "text-success bg-success/10 border-success/30",
    good: "text-info bg-info/10 border-info/30",
    warning1: "text-warning bg-warning/10 border-warning/30",
    warning2: "text-warning bg-warning/15 border-warning/40",
    critical: "text-destructive bg-destructive/10 border-destructive/30",
    off: "text-muted-foreground bg-muted/40 border-border",
  }[s];
}

export function totalExpenses(list: Machine[]) {
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const thisMonth = today.slice(0, 7);
  const thisYear = today.slice(0, 4);
  let day = 0,
    month = 0,
    year = 0,
    lifetime = 0;
  for (const m of list) {
    for (const h of m.history) {
      lifetime += h.cost;
      if (h.date === today) day += h.cost;
      if (h.date.startsWith(thisMonth)) month += h.cost;
      if (h.date.startsWith(thisYear)) year += h.cost;
    }
  }
  return { day, month, year, lifetime };
}

export function criticalExplanation(m: Machine) {
  const reasons: string[] = [];
  if (m.temperature > 85) reasons.push(`Temperature reached ${m.temperature}°C`);
  if (m.vibration > 6) reasons.push(`Vibration elevated to ${m.vibration} mm/s`);
  if (m.motorCurrent > 16) reasons.push(`Motor current exceeds safe limit (${m.motorCurrent} A)`);
  const daysSince = Math.round(
    (Date.now() - new Date(m.lastMaintenance).getTime()) / 86400000,
  );
  if (daysSince > m.serviceIntervalDays)
    reasons.push(`Machine has not been serviced for ${daysSince} days`);
  if (m.healthScore < 50) reasons.push("Bearing wear pattern detected in vibration signature");
  if (m.bugs.filter((b) => !b.resolved).length)
    reasons.push(`${m.bugs.filter((b) => !b.resolved).length} unresolved reported issues`);
  if (reasons.length === 0) reasons.push("Composite anomaly score above learned baseline");
  return reasons;
}
