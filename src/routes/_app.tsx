import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Send, X } from "lucide-react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { AppTopbar } from "@/components/app-topbar";
import { Toaster } from "@/components/ui/sonner";
import { getUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SupportHeadsetIcon } from "@/components/ui/support-headset-icon";
import { assistantSuggestions, respond, type AssistantMessage } from "@/lib/assistant";

export const Route = createFileRoute("/_app")({
  ssr: false,
  component: AppLayout,
});

function AppLayout() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [assistantInput, setAssistantInput] = useState("");
  const [assistantMessages, setAssistantMessages] = useState<AssistantMessage[]>([
    {
      role: "assistant",
      text: "Hi! I’m your AI assistant. Ask me about machine health, alerts, energy use, or maintenance planning.",
    },
  ]);

  const assistantPanelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    document.documentElement.classList.add("dark");

    const storedUser = getUser();
    if (!storedUser) {
      navigate({ to: "/auth" });
      return;
    }

    setReady(true);

    const timer = window.setInterval(() => setCurrentTime(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, [navigate]);

  useEffect(() => {
    if (!assistantOpen) return;

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;
      const clickedInsidePanel = assistantPanelRef.current?.contains(target);

      if (!clickedInsidePanel) {
        setAssistantOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [assistantOpen]);

  const formattedDay = new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
  }).format(currentTime);

  const formattedDate = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  }).format(currentTime);

  const formattedTime = new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(currentTime);

  function sendAssistantMessage() {
    if (!assistantInput.trim()) return;
    const q = assistantInput;
    setAssistantMessages((m) => [...m, { role: "user", text: q }]);
    setAssistantInput("");
    setTimeout(() => {
      setAssistantMessages((m) => [...m, { role: "assistant", text: respond(q) }]);
    }, 400);
  }

  function handleAssistantClick() {
    setAssistantOpen((v) => !v);
  }

  if (!ready) return null;

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <div className="flex flex-1 flex-col">
          <div className="flex items-center gap-1 border-b bg-card pl-2">
            <SidebarTrigger />
            <div className="flex-1">
              <AppTopbar />
            </div>
          </div>
          <main className="flex-1 p-4 md:p-6">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-3 border-b border-border/40 pb-4">
              <div className="space-y-1">
                <div className="text-[11px] font-semibold uppercase tracking-[0.35em] text-primary/80">{formattedDay}</div>
                <div className="text-lg font-medium text-muted-foreground sm:text-xl">{formattedDate}</div>
              </div>
              <div className="font-sans text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                {formattedTime}
              </div>
            </div>
            <Outlet />
          </main>
        </div>
        {assistantOpen ? (
          <div ref={assistantPanelRef} className="fixed z-50 w-[92vw] max-w-sm" style={{ left: 16, top: 16 }}>
            <Card className="border shadow-2xl">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <SupportHeadsetIcon className="h-4 w-4 text-primary" /> AI Assistant
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
                  {assistantMessages.map((message, index) => (
                    <div
                      key={index}
                      className={`rounded-lg px-3 py-2 text-sm ${message.role === "user" ? "bg-primary text-primary-foreground" : "bg-accent/70 text-foreground"}`}
                    >
                      {message.text}
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  {assistantSuggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => setAssistantInput(suggestion)}
                      className="rounded-full border bg-background px-2 py-1 text-xs hover:bg-accent"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={assistantInput}
                    onChange={(e) => setAssistantInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendAssistantMessage()}
                    placeholder="Ask about machine health..."
                  />
                  <Button onClick={sendAssistantMessage} size="icon">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : null}
        <Toaster />
      </div>
    </SidebarProvider>
  );
}
