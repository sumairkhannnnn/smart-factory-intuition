import { alerts, machines, maintenance, summary } from "@/lib/mockData";

export interface ChatMessage {
  role: "user" | "assistant";
  text: string;
}

export interface AssistantServiceResponse {
  reply: string;
  status?: string;
  contextUsed?: Record<string, unknown>;
}

function getAssistantBackendUrl(): string {
  return import.meta.env.VITE_ASSISTANT_BACKEND_URL || "http://127.0.0.1:8000/api/assistant";
}

function getAssistantApiKey(): string | undefined {
  return import.meta.env.VITE_ASSISTANT_API_KEY || undefined;
}

export function buildFactoryContext() {
  return {
    summary: summary(),
    machines: machines.map((machine) => ({
      name: machine.name,
      section: machine.section,
      status: machine.status,
      healthScore: machine.healthScore,
      temperature: machine.temperature,
      vibration: machine.vibration,
      motorCurrent: machine.motorCurrent,
      load: machine.load,
      remainingDays: machine.remainingDays,
      nextMaintenance: machine.nextMaintenance,
      lastMaintenance: machine.lastMaintenance,
      failureProbability: machine.failureProbability,
    })),
    alerts: alerts.slice(0, 8),
    maintenance: maintenance.slice(0, 8),
  };
}

export function buildGeminiPrompt(question: string, history: ChatMessage[] = []) {
  const context = buildFactoryContext();
  return `
You are SmartPredict Assistant for a Smart Factory dashboard.
Answer the user's question using the provided factory context.

Rules:
- Be concise, practical, and professional.
- Lead with the direct answer.
- Use bullet points when helpful.
- If the data is insufficient, say that clearly.
- Do not invent facts.

Factory context:
${JSON.stringify(context, null, 2)}

Conversation history:
${history.map((item) => `${item.role}: ${item.text}`).join("\n") || "None"}

User question:
${question}
`;
}

export async function askAssistant(question: string, history: ChatMessage[] = []): Promise<string> {
  const response = await fetch(getAssistantBackendUrl(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(getAssistantApiKey() ? { "X-API-Key": getAssistantApiKey()! } : {}),
    },
    body: JSON.stringify({ question, history }),
  });

  const data = (await response.json().catch(() => ({}))) as Partial<AssistantServiceResponse> & { error?: string };

  if (!response.ok || !data.reply) {
    throw new Error(data.error || "The assistant could not answer right now.");
  }

  return data.reply;
}
