import { machines, type Machine } from "@/lib/mockData";

export interface AssistantMessage {
  role: "user" | "assistant";
  text: string;
}

function formatResponse(bottomLine: string, details: string[]) {
  return [bottomLine, ...details.map((detail) => `- ${detail}`), "Source: [Current machine data]"].join("\n");
}

function formatWebResponse(summary: string, sourceUrl?: string) {
  return [summary, sourceUrl ? `- Source: [DuckDuckGo](${sourceUrl})` : "- Source: [DuckDuckGo]"].join("\n");
}

async function searchWeb(query: string): Promise<string | null> {
  try {
    const response = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_redirect=1&no_html=1`);
    if (!response.ok) return null;

    const data = (await response.json()) as {
      Answer?: string;
      AbstractText?: string;
      AbstractURL?: string;
      RelatedTopics?: Array<{ Text?: string; FirstURL?: string }>;
    };

    const directAnswer = data.Answer?.trim() || data.AbstractText?.trim();
    if (directAnswer) {
      return directAnswer;
    }

    const topicSnippet = data.RelatedTopics?.find((topic) => topic.Text)?.Text?.trim();
    if (topicSnippet) {
      return topicSnippet.replace(/\s+/g, " ").slice(0, 220);
    }

    return null;
  } catch {
    return null;
  }
}

function isAmbiguousQuestion(q: string): boolean {
  const lower = q.toLowerCase().trim();
  return lower.length < 4 || (lower.includes("it") && !lower.includes("machine") && !lower.includes("asset") && !lower.includes("unit"));
}

function findMachineInQuestion(q: string): Machine | null {
  const lower = q.toLowerCase();
  const directMatch = machines.find((machine) => lower.includes(machine.name.toLowerCase()));
  if (directMatch) return directMatch;

  const machineTypeKeywords = ["loom", "spinner", "dyeing", "press", "cnc", "lathe", "conveyor", "robotic"];
  const matchedType = machineTypeKeywords.find((keyword) => lower.includes(keyword));
  if (matchedType) {
    return machines.find((machine) => machine.name.toLowerCase().includes(matchedType)) ?? null;
  }

  return null;
}

function isMachineDataQuestion(q: string): boolean {
  const lower = q.toLowerCase();
  const hasMachineReference = /machine|asset|unit|equipment|loom|spinner|dyeing|press|cnc|lathe|conveyor|robotic/.test(lower);
  const hasDataSignal = /health|status|temperature|vibration|alert|overheat|critical|replace|motor|bearing|energy|power|current|load|running|remaining|condition|schedule|problem|repair|failing|doing|operating/.test(lower);
  return !!findMachineInQuestion(q) || (hasMachineReference && hasDataSignal);
}

function buildMachineResponse(q: string, machine: Machine): string {
  const lower = q.toLowerCase();

  if (lower.includes("temperature") || lower.includes("overheat")) {
    return formatResponse(`${machine.name} is currently ${machine.temperature}°C.`, [
      "This is above the normal operating range for the current project data.",
      "Inspect cooling and lubrication soon.",
    ]);
  }

  if (lower.includes("vibration") || lower.includes("replace") || lower.includes("motor") || lower.includes("bearing")) {
    return formatResponse(`${machine.name} is showing vibration at ${machine.vibration} mm/s.`, [
      `The current risk level is ${machine.status}.`,
      `Plan maintenance within ${Math.max(3, machine.remainingDays - 2)} days.`,
    ]);
  }

  if (lower.includes("maintenance") || lower.includes("schedule") || lower.includes("next maintenance") || lower.includes("last maintenance")) {
    return formatResponse(`${machine.name} is due for maintenance by ${machine.nextMaintenance}.`, [
      `Last maintenance: ${machine.lastMaintenance}.`,
      `Health score is ${machine.healthScore}%.`,
    ]);
  }

  if (lower.includes("energy") || lower.includes("power") || lower.includes("current") || lower.includes("load")) {
    return formatResponse(`${machine.name} is drawing ${machine.motorCurrent}A at ${machine.load}% load.`, [
      "This suggests elevated operating demand.",
      "Monitor it for overload or efficiency drop.",
    ]);
  }

  if (lower.includes("status") || lower.includes("health") || lower.includes("how is") || lower.includes("doing") || lower.includes("condition") || lower.includes("working")) {
    return formatResponse(`${machine.name} is currently ${machine.status}.`, [
      `Health score: ${machine.healthScore}%.`,
      `Temperature: ${machine.temperature}°C | Vibration: ${machine.vibration} mm/s | Remaining days: ${machine.remainingDays}.`,
    ]);
  }

  return formatResponse(`${machine.name} is currently ${machine.status}.`, [
    `Health score: ${machine.healthScore}%.`,
    `Temperature: ${machine.temperature}°C | Vibration: ${machine.vibration} mm/s.`,
  ]);
}

function isGeneralKnowledgeQuestion(q: string): boolean {
  const lower = q.toLowerCase();
  const generalTopics = [
    "how do",
    "what is",
    "what does",
    "why does",
    "how does",
    "define",
    "best practice",
    "maintenance",
    "how to",
    "industry",
    "textile",
    "machine",
    "equipment",
    "process",
    "standard",
    "procedure",
  ];

  return generalTopics.some((topic) => lower.includes(topic));
}

export async function respond(q: string): Promise<string> {
  const lower = q.toLowerCase().trim();

  if (!lower) {
    return formatResponse("I need a clear question to provide a useful answer.", ["Please ask about a machine, risk, maintenance issue, or energy concern."]);
  }

  if (isAmbiguousQuestion(q)) {
    return formatResponse("I need a bit more detail to answer accurately.", ["Please specify the machine, area, or issue you want evaluated."]);
  }

  if (isMachineDataQuestion(q)) {
    const matchedMachine = findMachineInQuestion(q) ?? machines.find((machine) => machine.status === "critical") ?? machines[0];
    return matchedMachine ? buildMachineResponse(q, matchedMachine) : formatResponse("I checked the current project data and could not find a matching machine entry.", ["Please specify the machine name or ID."]);
  }

  const shouldUseWeb =
    (isGeneralKnowledgeQuestion(q) || lower.includes("what") || lower.includes("how") || lower.includes("why") || lower.includes("compare") || lower.includes("define") || lower.includes("latest") || lower.includes("news") || lower.includes("external")) &&
    !lower.includes("overheat") &&
    !lower.includes("temperature") &&
    !lower.includes("replace") &&
    !lower.includes("motor") &&
    !lower.includes("bearing") &&
    !lower.includes("critical") &&
    !lower.includes("immediate") &&
    !lower.includes("energy") &&
    !lower.includes("power") &&
    !lower.includes("schedule") &&
    !lower.includes("maintenance");

  if (shouldUseWeb) {
    const webAnswer = await searchWeb(q);
    if (webAnswer) {
      return formatWebResponse(webAnswer);
    }
    return formatResponse("I could not find sufficient information to fully answer your request.", ["Please share a bit more detail or a more specific topic."]);
  }

  if (lower.includes("overheat") || lower.includes("temperature")) {
    const m = machines.reduce((a, b) => (a.temperature > b.temperature ? a : b));
    return formatResponse(
      `${m.name} in ${m.section} is the hottest asset at ${m.temperature}°C.`,
      [
        "Immediate risk: temperature is above the normal operating range.",
        "Next action: inspect cooling, airflow, and lubrication today.",
      ],
    );
  }

  if (lower.includes("replace") || lower.includes("motor") || lower.includes("bearing")) {
    const m = machines.filter((x) => x.vibration > 5).sort((a, b) => b.vibration - a.vibration)[0];
    return m
      ? formatResponse(
          `${m.name} is the strongest replacement candidate.`,
          [
            `Vibration is ${m.vibration} mm/s, which is above the warning threshold.`,
            `Plan maintenance within ${Math.max(3, m.remainingDays - 2)} days.`,
          ],
        )
      : formatResponse("No urgent replacement is indicated from the current data.", ["The existing signal levels are still within a manageable range."]);
  }

  if (lower.includes("attention") || lower.includes("critical") || lower.includes("immediate")) {
    const c = machines.filter((m) => m.status === "critical");
    if (c.length === 0) {
      return formatResponse("No machines are in a critical state right now.", ["Current fleet condition appears stable."]);
    }
    return formatResponse(
      `${c.length} machine(s) need immediate action.`,
      [
        `Priority units: ${c.slice(0, 3).map((m) => m.name).join(", ")}.`,
        "Dispatch the lowest-health unit first.",
      ],
    );
  }

  if (lower.includes("energy") || lower.includes("power")) {
    const total = machines.reduce((a, m) => a + m.motorCurrent * m.runningHours * 0.001, 0);
    return formatResponse(
      `Fleet energy use is about ${total.toFixed(0)} kWh.`,
      [
        "Highest-current lines are the main pressure points.",
        "Shift load to reduce peak demand.",
      ],
    );
  }

  if (lower.includes("maintenance") || lower.includes("schedule")) {
    const pending = machines.filter((m) => m.remainingDays <= 7).slice(0, 3);
    if (pending.length === 0) {
      return formatResponse("No maintenance actions are due imminently from the current data.", ["The schedule remains manageable at the moment."]);
    }
    return formatResponse(
      `Maintenance priority is concentrated in ${pending.map((m) => m.name).join(", ")}.`,
      ["Review these jobs during the current shift.", "Escalate if any condition worsens before the next inspection."],
    );
  }

  if (lower.includes("latest") || lower.includes("market") || lower.includes("forecast") || lower.includes("external") || lower.includes("news")) {
    return formatResponse(
      "I could not find sufficient information to fully answer your request.",
      ["Please provide the specific topic, timeframe, or source you want evaluated.", "I can analyze the available operational data once the scope is clear."],
    );
  }

  return formatResponse(
    "I can assess current machine health, urgent risks, maintenance timing, and energy pressure.",
    [
      "Ask with a specific machine, KPI, or issue.",
      "If you need broader external facts, I could not find sufficient information to fully answer your request.",
    ],
  );
}

export const assistantSuggestions = [
  "Which machine is overheating most?",
  "Which unit needs replacement soon?",
  "What needs immediate attention?",
];
