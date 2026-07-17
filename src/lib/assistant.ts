import { machines } from "@/lib/mockData";

export interface AssistantMessage {
  role: "user" | "assistant";
  text: string;
}

export function respond(q: string): string {
  const lower = q.toLowerCase();
  if (lower.includes("overheat") || lower.includes("temperature")) {
    const m = machines.reduce((a, b) => (a.temperature > b.temperature ? a : b));
    return `${m.name} in ${m.section} is running hottest at ${m.temperature}°C. Likely causes: reduced coolant flow, clogged filter, or bearing wear. Recommended action: inspect cooling loop and lubrication within 24 hours.`;
  }
  if (lower.includes("replace") || lower.includes("motor") || lower.includes("bearing")) {
    const m = machines.filter((x) => x.vibration > 5).sort((a, b) => b.vibration - a.vibration)[0];
    return m
      ? `${m.name} shows high vibration (${m.vibration} mm/s). Bearing replacement is recommended within ${Math.max(3, m.remainingDays - 2)} days.`
      : "No motor currently requires urgent replacement.";
  }
  if (lower.includes("attention") || lower.includes("critical") || lower.includes("immediate")) {
    const c = machines.filter((m) => m.status === "critical");
    if (c.length === 0) return "No machines are in critical state. Great job!";
    return `${c.length} machines need immediate attention: ${c
      .slice(0, 3)
      .map((m) => m.name)
      .join(", ")}. Start with the lowest health score.`;
  }
  if (lower.includes("energy") || lower.includes("power")) {
    const total = machines.reduce((a, m) => a + m.motorCurrent * m.runningHours * 0.001, 0);
    return `Estimated fleet energy usage: ${total.toFixed(0)} kWh. Consider load balancing on high-current lines.`;
  }
  return "I can help with machine health, temperature, vibration, energy usage, and maintenance planning. Try asking about a specific machine or KPI.";
}

export const assistantSuggestions = [
  "Why is Machine A overheating?",
  "When should I replace the motor?",
  "Which machine needs immediate attention?",
];
