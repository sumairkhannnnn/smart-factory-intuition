import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowLeft, Factory, Activity, ShieldCheck, Chrome } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { observeAuthState, setUserRole, signInWithEmail, signInWithGoogle, signUpWithEmail, type User } from "@/lib/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({ meta: [{ title: "Sign in — Smart Factory Insights" }] }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState<"Founder" | "Supervisor" | null>(null);
  const [highlightedRole, setHighlightedRole] = useState<"Founder" | "Supervisor" | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [errorMessage, setErrorMessage] = useState("");
  const isGoogleAuthenticating = useRef(false);

  useEffect(() => {
    document.documentElement.classList.add("dark");

    const unsubscribe = observeAuthState((user) => {
      if (isGoogleAuthenticating.current) return;
      if (user) {
        toast.success(`Welcome ${user.name}`);
        navigate({ to: "/dashboard" });
      }
    });

    return unsubscribe;
  }, [navigate]);

  function handleRoleSelect(role: "Founder" | "Supervisor") {
    setSelectedRole(role);
    setErrorMessage("");
  }

  function handleBack() {
    setSelectedRole(null);
    setErrorMessage("");
    setUsername("");
    setPassword("");
    setDisplayName("");
    setMode("login");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");

    if (!selectedRole) {
      const message = "Please choose a role first";
      setErrorMessage(message);
      toast.error(message);
      return;
    }

    if (!username || !password) {
      const message = "Please enter your email address and password";
      setErrorMessage(message);
      toast.error(message);
      return;
    }

    const enteredName = displayName.trim();
    if (mode === "signup" && !enteredName) {
      const message = "Please enter your full name";
      setErrorMessage(message);
      toast.error(message);
      return;
    }

    const role: User["role"] = selectedRole === "Founder" ? "owner" : "supervisor";

    try {
      const user =
        mode === "signup"
          ? await signUpWithEmail(username, password, enteredName, role)
          : await signInWithEmail(username, password, role);

      setUserRole(role);
      toast.success(mode === "signup" ? `Welcome, ${user.name}` : `Welcome back, ${user.name}`);
      navigate({ to: "/dashboard" });
    } catch (error) {
      console.error(error);
      const message = error instanceof Error ? error.message : "Authentication failed";
      setErrorMessage(message);
      toast.error(message);
    }
  }

  async function handleGoogleAuth() {
    if (!selectedRole) return;

    setErrorMessage("");
    isGoogleAuthenticating.current = true;
    const role: User["role"] = selectedRole === "Founder" ? "owner" : "supervisor";

    try {
      const user = await signInWithGoogle(mode, role, displayName.trim());
      if (!user) return;

      setUserRole(role);
      toast.success(mode === "signup" ? `Welcome, ${user.name}` : `Welcome back, ${user.name}`);
      navigate({ to: "/dashboard" });
    } catch (error) {
      console.error(error);
      const message = error instanceof Error ? error.message : "Google authentication failed";
      setErrorMessage(message);
      toast.error(message);
    } finally {
      isGoogleAuthenticating.current = false;
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#020617] p-4 sm:p-6 lg:p-8">
      {/* Animated factory background */}
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1581092921461-eab62e97a780?auto=format&fit=crop&w=2400&q=85"
          alt=""
          aria-hidden="true"
          className="h-full w-full object-cover object-center opacity-75 saturate-125"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(2,6,23,0.93),rgba(2,6,23,0.48),rgba(2,6,23,0.88))]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_22%,rgba(99,102,241,0.5),transparent_42%),radial-gradient(circle_at_84%_72%,rgba(6,182,212,0.38),transparent_40%)] mix-blend-screen" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(125,211,252,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(125,211,252,0.1)_1px,transparent_1px)] bg-[size:56px_56px]" />
        <div className="absolute inset-x-0 bottom-0 h-[42%] bg-[linear-gradient(165deg,transparent_0%,rgba(8,23,45,0.75)_38%,rgba(3,8,18,0.96)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-[repeating-linear-gradient(90deg,transparent_0,transparent_68px,rgba(56,189,248,0.1)_69px,transparent_70px)] [mask-image:linear-gradient(to_top,black,transparent)]" />
        <div className="absolute left-1/2 top-1/2 h-[46rem] w-[46rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-info/10 shadow-[0_0_130px_30px_rgba(14,165,233,0.08)]" />
        {/* Floating orbs */}
        <div className="absolute -left-24 top-1/4 h-72 w-72 animate-pulse rounded-full bg-info/20 blur-3xl" />
        <div className="absolute -right-24 bottom-1/4 h-96 w-96 animate-pulse rounded-full bg-primary/20 blur-3xl" style={{ animationDelay: "1s" }} />
        {/* Rotating gears silhouette */}
        <svg className="absolute right-10 top-10 h-40 w-40 animate-spin text-info/20" style={{ animationDuration: "20s" }} viewBox="0 0 100 100" fill="currentColor">
          <path d="M50 20a30 30 0 100 60 30 30 0 000-60zm0 45a15 15 0 110-30 15 15 0 010 30z" />
          <path d="M48 4h4v12h-4zM48 84h4v12h-4zM4 48h12v4H4zM84 48h12v4H84z" />
        </svg>
        <svg className="absolute bottom-16 left-16 h-28 w-28 animate-spin text-primary/20" style={{ animationDuration: "15s", animationDirection: "reverse" }} viewBox="0 0 100 100" fill="currentColor">
          <path d="M50 20a30 30 0 100 60 30 30 0 000-60zm0 45a15 15 0 110-30 15 15 0 010 30z" />
          <path d="M48 4h4v12h-4zM48 84h4v12h-4zM4 48h12v4H4zM84 48h12v4H84z" />
        </svg>
      </div>

      <div className="relative w-full max-w-5xl">
        {!selectedRole ? (
          <div className="mx-auto max-w-4xl text-center text-slate-100">
            <div className="mb-8 inline-flex items-center gap-3 rounded-full border border-cyan-200/20 bg-slate-950/35 px-4 py-2 text-sm font-medium text-cyan-50 shadow-lg shadow-cyan-950/30 backdrop-blur-md">
              <Factory className="h-4 w-4 text-cyan-300" />
              <span>Smart Factory Insights</span>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(74,222,128,1)]" />
            </div>
            <h1 className="bg-gradient-to-r from-white via-cyan-100 to-indigo-200 bg-clip-text text-4xl font-bold tracking-tight text-transparent drop-shadow-[0_5px_20px_rgba(56,189,248,0.2)] sm:text-5xl">
              Choose your access level
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base font-medium leading-7 text-slate-300 sm:text-lg">
              Select the role that matches your responsibilities to continue into the factory workspace.
            </p>

            <div className="mt-10 grid gap-5 md:grid-cols-2">
              <button
                type="button"
                onClick={() => handleRoleSelect("Founder")}
                onMouseEnter={() => setHighlightedRole("Founder")}
                onMouseLeave={() => setHighlightedRole(null)}
                onFocus={() => setHighlightedRole("Founder")}
                onBlur={() => setHighlightedRole(null)}
                className={`group relative overflow-hidden rounded-3xl border border-info/20 bg-[radial-gradient(circle_at_85%_10%,rgba(14,165,233,0.35),transparent_36%),linear-gradient(135deg,rgba(10,35,66,0.95),rgba(8,15,31,0.8))] p-8 text-left shadow-[0_20px_45px_rgba(0,0,0,0.32)] transition duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-info ${
                  highlightedRole === "Founder"
                    ? "-translate-y-2 scale-[1.04] border-info/60 bg-white/15 shadow-info/30"
                    : highlightedRole === "Supervisor"
                      ? "scale-[0.97] opacity-45 blur-[1px]"
                      : "hover:-translate-y-1 hover:scale-[1.02] hover:border-info/60 hover:bg-white/15"
                }`}
              >
                <div className="absolute -right-10 -top-12 h-44 w-44 rounded-full border border-info/30 bg-info/10 transition duration-500 group-hover:scale-125" />
                <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-info to-transparent opacity-70" />
                <div className="relative z-10 flex items-start justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-info to-primary text-white shadow-lg shadow-info/30">
                    <ShieldCheck className="h-6 w-6" />
                  </div>
                  <span className="rounded-full border border-info/30 bg-info/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-info transition group-hover:translate-x-1">Executive</span>
                </div>
                <h2 className="relative z-10 mt-8 text-2xl font-semibold">Founder</h2>
                <p className="relative z-10 mt-3 text-sm leading-6 text-white/70">
                  Oversee operations, approve actions, and monitor the most critical factory signals.
                </p>
                <div className="relative z-10 mt-6 flex items-center gap-2 text-xs font-medium text-info/90"><span className="h-2 w-2 rounded-full bg-info shadow-[0_0_12px_rgba(56,189,248,1)]" /> Command center access</div>
              </button>

              <button
                type="button"
                onClick={() => handleRoleSelect("Supervisor")}
                onMouseEnter={() => setHighlightedRole("Supervisor")}
                onMouseLeave={() => setHighlightedRole(null)}
                onFocus={() => setHighlightedRole("Supervisor")}
                onBlur={() => setHighlightedRole(null)}
                className={`group relative overflow-hidden rounded-3xl border border-cyan-300/20 bg-[radial-gradient(circle_at_15%_10%,rgba(6,182,212,0.3),transparent_35%),linear-gradient(135deg,rgba(12,43,57,0.95),rgba(7,17,31,0.82))] p-8 text-left shadow-[0_20px_45px_rgba(0,0,0,0.32)] transition duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                  highlightedRole === "Supervisor"
                    ? "-translate-y-2 scale-[1.04] border-primary/60 bg-white/15 shadow-primary/30"
                    : highlightedRole === "Founder"
                      ? "scale-[0.97] opacity-45 blur-[1px]"
                      : "hover:-translate-y-1 hover:scale-[1.02] hover:border-primary/60 hover:bg-white/15"
                }`}
              >
                <div className="absolute -bottom-16 -left-10 h-48 w-48 rounded-full border border-cyan-300/25 bg-cyan-300/10 transition duration-500 group-hover:scale-125" />
                <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-300 to-transparent opacity-70" />
                <div className="relative z-10 flex items-start justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-cyan-400 text-white shadow-lg shadow-cyan-400/25">
                    <Activity className="h-6 w-6" />
                  </div>
                  <span className="rounded-full border border-cyan-300/30 bg-cyan-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-200 transition group-hover:translate-x-1">Operations</span>
                </div>
                <h2 className="relative z-10 mt-8 text-2xl font-semibold">Supervisor</h2>
                <p className="relative z-10 mt-3 text-sm leading-6 text-white/70">
                  Coordinate shifts, review machine health, and respond to real-time operational alerts.
                </p>
                <div className="relative z-10 mt-6 flex items-center gap-2 text-xs font-medium text-cyan-100/90"><span className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_12px_rgba(103,232,249,1)]" /> Live floor access</div>
              </button>
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-xl">
            <button
              type="button"
              onClick={handleBack}
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-2 text-sm text-white/80 transition hover:bg-white/15"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>

            <Card className="border-white/10 bg-white/5 text-white shadow-2xl shadow-primary/20 backdrop-blur-2xl">
              <CardHeader>
                <CardTitle className="text-2xl">
                  {mode === "signup" ? "Sign up" : "Sign in"} as {selectedRole}
                </CardTitle>
                <CardDescription className="text-white/60">
                  {mode === "signup"
                    ? "Create your account first. You can register with your email or Google account."
                    : "Already registered? Sign in with the same email or Google account you used during sign up."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4 flex rounded-full border border-white/10 bg-white/10 p-1">
                  <button
                    type="button"
                    onClick={() => {
                      setMode("login");
                      setErrorMessage("");
                    }}
                    className={`flex-1 rounded-full px-3 py-2 text-sm transition ${mode === "login" ? "bg-primary text-white" : "text-white/70"}`}
                  >
                    Sign in
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMode("signup");
                      setErrorMessage("");
                    }}
                    className={`flex-1 rounded-full px-3 py-2 text-sm transition ${mode === "signup" ? "bg-primary text-white" : "text-white/70"}`}
                  >
                    Sign up
                  </button>
                </div>

                <form className="space-y-4" onSubmit={submit}>
                  {mode === "login" ? (
                    <p className="rounded-md border border-info/20 bg-info/10 px-3 py-2 text-sm text-info-foreground">
                      New here? Select <span className="font-semibold">Sign up</span> first, then register with Google before using Google sign-in.
                    </p>
                  ) : null}
                  {mode === "signup" ? (
                    <Field
                      label="Your name"
                      value={displayName}
                      onChange={setDisplayName}
                      autoComplete="name"
                      placeholder="Jane Doe"
                    />
                  ) : null}
                  <Field
                    label="Email address"
                    value={username}
                    onChange={setUsername}
                    type="email"
                    autoComplete="email"
                    placeholder="name@company.com"
                  />
                  <Field
                    label="Password"
                    value={password}
                    onChange={setPassword}
                    type="password"
                    autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  />
                  {errorMessage ? (
                    <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                      {errorMessage}
                    </div>
                  ) : null}
                  <Button type="submit" className="w-full bg-gradient-to-r from-info to-primary shadow-lg shadow-primary/30">
                    {mode === "signup" ? "Create account" : "Continue"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full border-white/20 bg-white/10 text-white hover:bg-white/20"
                    onClick={handleGoogleAuth}
                  >
                    <Chrome className="mr-2 h-4 w-4" />
                    {mode === "signup" ? "Sign up with Google" : "Sign in with Google"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  autoComplete,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  autoComplete?: string;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-white/80">{label}</Label>
      <Input
        type={type}
        value={value}
        autoComplete={autoComplete}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="border-white/20 bg-white/10 text-white placeholder:text-white/40 focus-visible:ring-info"
      />
    </div>
  );
}
