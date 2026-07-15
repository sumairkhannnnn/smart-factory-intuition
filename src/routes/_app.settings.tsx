import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { getUser, signIn } from "@/lib/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const [user, setUser] = useState(getUser());
  const [factory, setFactory] = useState("Bharat Textiles Pvt Ltd");
  const [technicians, setTechnicians] = useState(["Ravi Kumar", "Amit Shah", "Priya Patel"]);
  const [newTech, setNewTech] = useState("");
  const [machineName, setMachineName] = useState("");
  const [thresholds, setThresholds] = useState({ temp: 90, vib: 6, current: 18 });
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function saveProfile() {
    if (!user) return;
    signIn(user);
    toast.success("Profile saved");
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">Configure factory, machines, and alerts</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>User Profile</CardTitle>
            <CardDescription>Update your personal information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input
                value={user?.name || ""}
                onChange={(e) => user && setUser({ ...user, name: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input
                value={user?.email || ""}
                onChange={(e) => user && setUser({ ...user, email: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Input value={user?.role || ""} disabled className="capitalize" />
            </div>
            <Button onClick={saveProfile}>Save</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>Switch between light and dark mode</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between rounded-md border p-3">
              <div>
                <div className="font-medium">Dark mode</div>
                <div className="text-xs text-muted-foreground">Reduce glare on the shop floor</div>
              </div>
              <Switch
                checked={dark}
                onCheckedChange={(v) => {
                  setDark(v);
                  document.documentElement.classList.toggle("dark", v);
                }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Factory</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label>Factory name</Label>
              <Input value={factory} onChange={(e) => setFactory(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Add machine</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Loom 210"
                  value={machineName}
                  onChange={(e) => setMachineName(e.target.value)}
                />
                <Button
                  onClick={() => {
                    if (machineName) {
                      toast.success(`Machine "${machineName}" added`);
                      setMachineName("");
                    }
                  }}
                >
                  Add
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Technicians</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Input
                placeholder="Add technician"
                value={newTech}
                onChange={(e) => setNewTech(e.target.value)}
              />
              <Button
                onClick={() => {
                  if (newTech) {
                    setTechnicians([...technicians, newTech]);
                    setNewTech("");
                    toast.success("Technician added");
                  }
                }}
              >
                Add
              </Button>
            </div>
            <div className="space-y-1">
              {technicians.map((t) => (
                <div key={t} className="rounded-md border px-3 py-2 text-sm">
                  {t}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Alert Thresholds</CardTitle>
            <CardDescription>Trigger critical alerts above these values</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-3">
            <Threshold
              label="Temperature"
              value={thresholds.temp}
              unit="°C"
              min={50}
              max={130}
              onChange={(v) => setThresholds({ ...thresholds, temp: v })}
            />
            <Threshold
              label="Vibration"
              value={thresholds.vib}
              unit="mm/s"
              min={1}
              max={15}
              onChange={(v) => setThresholds({ ...thresholds, vib: v })}
            />
            <Threshold
              label="Motor Current"
              value={thresholds.current}
              unit="A"
              min={5}
              max={40}
              onChange={(v) => setThresholds({ ...thresholds, current: v })}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Threshold({
  label,
  value,
  unit,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  unit: string;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <Label>{label}</Label>
        <span className="text-sm font-semibold">
          {value} {unit}
        </span>
      </div>
      <Slider min={min} max={max} value={[value]} onValueChange={(v) => onChange(v[0])} />
    </div>
  );
}
