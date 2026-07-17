import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { Send, User as UserIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SupportHeadsetIcon } from "@/components/ui/support-headset-icon";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { assistantSuggestions } from "@/lib/assistant";
import { askAssistant, type ChatMessage } from "@/lib/ai-service";

export const Route = createFileRoute("/_app/assistant")({
  component: Assistant,
});

function Assistant() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      text: "Hi! I'm your Research & Logic Assistant. I can answer from live factory data and web sources.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send() {
    if (!input.trim() || isTyping) return;
    const q = input;
    setMessages((m) => [...m, { role: "user", text: q }]);
    setInput("");
    setIsTyping(true);
    setError(null);

    try {
      const reply = await askAssistant(q, messages);
      setMessages((m) => [...m, { role: "assistant", text: reply }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error");
      setMessages((m) => [...m, { role: "assistant", text: "I couldn't process that request. Please try again." }]);
    } finally {
      setIsTyping(false);
    }
  }

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
            <SupportHeadsetIcon className="h-4 w-4 text-primary" /> SmartPredict Assistant
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
                    <SupportHeadsetIcon className="h-4 w-4" />
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
            {isTyping ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="h-2 w-2 animate-pulse rounded-full bg-primary" />
                <span>Thinking…</span>
              </div>
            ) : null}
            {error ? <div className="text-sm text-destructive">{error}</div> : null}
            <div ref={endRef} />
          </div>
          <div className="flex flex-wrap gap-2">
            {assistantSuggestions.map((s) => (
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
