import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { Bot, Send, User as UserIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { machines } from "@/lib/mockData";

export const Route = createFileRoute("/_app/assistant")({
  component: Assistant,
});

interface Msg {
  role: "user" | "assistant";
  text: string;
}

function respond(q: string): string {
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

function Assistant() {
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      text: "Hi! I'm your SmartPredict AI assistant. Ask me about any machine, alert, or maintenance plan.",
    },
  ]);
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function send() {
    if (!input.trim()) return;
    const q = input;
    setMessages((m) => [...m, { role: "user", text: q }]);
    setInput("");
    setTimeout(() => {
      setMessages((m) => [...m, { role: "assistant", text: respond(q) }]);
    }, 400);
  }

  const suggestions = [
    "Why is Machine A overheating?",
    "When should I replace the motor?",
    "Which machine needs immediate attention?",
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">AI Assistant</h1>
        <p className="text-sm text-muted-foreground">
          Get maintenance recommendations from live sensor data
        </p>
      </div>
      <Card className="flex h-[70vh] flex-col">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-4 w-4 text-primary" /> SmartPredict Assistant
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col gap-3 overflow-hidden">
          <div className="flex-1 space-y-3 overflow-y-auto pr-1">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {m.role === "assistant" && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                    <Bot className="h-4 w-4" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                    m.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-accent/60 text-foreground"
                  }`}
                >
                  {m.text}
                </div>
                {m.role === "user" && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                    <UserIcon className="h-4 w-4" />
                  </div>
                )}
              </div>
            ))}
            <div ref={endRef} />
          </div>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={() => setInput(s)}
                className="rounded-full border bg-background px-3 py-1 text-xs hover:bg-accent"
              >
                {s}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Ask about a machine, alert, or recommendation..."
            />
            <Button onClick={send}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
