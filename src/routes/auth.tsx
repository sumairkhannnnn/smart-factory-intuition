import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { ArrowLeft, Factory, Cpu, Activity, ShieldCheck, Chrome } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { completeGoogleRedirectSignIn, observeAuthState, setUserRole, signInWithEmail, signInWithGoogle, signUpWithEmail, type User } from "@/lib/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({ meta: [{ title: "Sign in — Smart Factory Insights" }] }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState<"Owner" | "Supervisor" | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    document.documentElement.classList.add("dark");

    const unsubscribe = observeAuthState((user) => {
      if (user) {
        toast.success(`Welcome ${user.name}`);
        navigate({ to: "/dashboard" });
      }
    });

    void completeGoogleRedirectSignIn(
      selectedRole === "Owner" ? "owner" : selectedRole === "Supervisor" ? "supervisor" : "owner",
      displayName.trim(),
    )
      .then((user) => {
        if (user) {
          toast.success(`Welcome ${user.name}`);
          navigate({ to: "/dashboard" });
        }
      })
      .catch((error) => {
        console.error(error);
        const message = error instanceof Error ? error.message : "Google sign-in failed";
        setErrorMessage(message);
        toast.error(message);
      });

    return unsubscribe;
  }, [navigate]);

  function handleRoleSelect(role: "Owner" | "Supervisor") {
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
      const message = mode === "signup" ? "Please enter a username and password" : "Please enter your username and password";
      setErrorMessage(message);
      toast.error(message);
      return;
    }

    const enteredName = displayName.trim();
    if (!enteredName) {
      const message = "Please enter your name";
      setErrorMessage(message);
      toast.error(message);
      return;
    }

    if (mode === "signup" && !enteredName) {
      const message = "Please enter your full name";
      setErrorMessage(message);
      toast.error(message);
      return;
    }

    const role: User["role"] = selectedRole === "Owner" ? "owner" : "supervisor";

    try {
      const user =
        mode === "signup"
          ? await signUpWithEmail(username, password, enteredName, role)
          : await signInWithEmail(username, password, role, enteredName);

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

  async function handleGoogleSignIn() {
    setErrorMessage("");

    if (!selectedRole) {
      const message = "Please choose a role first";
      setErrorMessage(message);
      toast.error(message);
      return;
    }

    const role: User["role"] = selectedRole === "Owner" ? "owner" : "supervisor";

    try {
      const user = await signInWithGoogle(role, displayName.trim());
      if (user) {
        setUserRole(role);
        toast.success(`Welcome ${user.name}`);
        navigate({ to: "/dashboard" });
      } else {
        toast.info("Redirecting to Google for sign-in...");
      }
    } catch (error) {
      console.error(error);
      const message = error instanceof Error ? error.message : "Google sign-in failed";
      setErrorMessage(message);
      toast.error(message);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#050914] p-4 sm:p-6 lg:p-8">
      {/* Animated factory background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(59,130,246,0.25),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_70%,rgba(6,182,212,0.2),transparent_50%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.06)_1px,transparent_1px)] bg-[size:56px_56px]" />
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
          <div className="mx-auto max-w-4xl text-center text-white">
            <div className="mb-8 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm text-white/80 backdrop-blur-md">
              <Factory className="h-4 w-4 text-info" />
              Smart Factory Insights
            </div>
            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
              Choose your access level
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base text-white/70 sm:text-lg">
              Select the role that matches your responsibilities to continue into the factory workspace.
            </p>

            <div className="mt-10 grid gap-4 md:grid-cols-2">
              <button
                type="button"
                onClick={() => handleRoleSelect("Owner")}
                className="group rounded-3xl border border-white/10 bg-white/10 p-8 text-left shadow-lg shadow-black/20 transition duration-300 hover:-translate-y-1 hover:border-info/60 hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-info"
              >
                <div className="flex items-start justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-info to-primary text-white">
                    <ShieldCheck className="h-6 w-6" />
                  </div>
                  <span className="text-sm font-medium text-info transition group-hover:translate-x-1">Select →</span>
                </div>
                <h2 className="mt-6 text-2xl font-semibold">Owner</h2>
                <p className="mt-3 text-sm leading-6 text-white/70">
                  Oversee operations, approve actions, and monitor the most critical factory signals.
                </p>
              </button>

              <button
                type="button"
                onClick={() => handleRoleSelect("Supervisor")}
                className="group rounded-3xl border border-white/10 bg-white/10 p-8 text-left shadow-lg shadow-black/20 transition duration-300 hover:-translate-y-1 hover:border-primary/60 hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <div className="flex items-start justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-cyan-400 text-white">
                    <Activity className="h-6 w-6" />
                  </div>
                  <span className="text-sm font-medium text-primary transition group-hover:translate-x-1">Select →</span>
                </div>
                <h2 className="mt-6 text-2xl font-semibold">Supervisor</h2>
                <p className="mt-3 text-sm leading-6 text-white/70">
                  Coordinate shifts, review machine health, and respond to real-time operational alerts.
                </p>
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
                <CardTitle className="text-2xl">Sign in as {selectedRole}</CardTitle>
                <CardDescription className="text-white/60">
                  Enter your workspace credentials to continue.
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
                  <Field label="Your name" value={displayName} onChange={setDisplayName} autoComplete="name" placeholder="Jane Doe" />
                  <Field label={mode === "signup" ? "Create username" : "Email or username"} value={username} onChange={setUsername} autoComplete="username" placeholder={mode === "signup" ? "janedoe" : "name@company.com or owner/supervisor"} />
                  <Field label="Password" value={password} onChange={setPassword} type="password" autoComplete="current-password" />
                  {errorMessage ? (
                    <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                      {errorMessage}
                    </div>
                  ) : null}
                  <Button type="submit" className="w-full bg-gradient-to-r from-info to-primary shadow-lg shadow-primary/30">
                    {mode === "signup" ? "Create account" : "Continue"}
                  </Button>
                  <Button type="button" variant="outline" className="w-full border-white/20 bg-white/10 text-white hover:bg-white/20" onClick={handleGoogleSignIn}>
                    <Chrome className="mr-2 h-4 w-4" />
                    Continue with Google
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
