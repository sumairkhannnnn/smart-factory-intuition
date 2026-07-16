import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { addMachine, type MachineStatus } from "@/lib/store";
import { toast } from "sonner";

const TYPES = ["Loom", "Spinner", "Dyeing Vat", "Press", "CNC Mill", "Lathe", "Conveyor", "Robotic Arm", "Injection Molder", "Other"];

export function AddMachineDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const [form, setForm] = useState({
    name: "",
    machineId: "",
    type: "Loom",
    section: "",
    manufacturer: "",
    installedOn: new Date().toISOString().slice(0, 10),
    lastMaintenance: new Date().toISOString().slice(0, 10),
    serviceIntervalDays: 90,
    status: "healthy" as MachineStatus,
  });

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function submit() {
    if (!form.name || !form.machineId) {
      toast.error("Machine name and ID required");
      return;
    }
    addMachine({
      id: `mc-${Date.now()}`,
      ...form,
      function: `${form.type} operations`,
    });
    toast.success(`${form.name} added to the fleet`);
    onOpenChange(false);
    setForm({ ...form, name: "", machineId: "" });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Machine</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Machine Name" value={form.name} onChange={(v) => set("name", v)} />
          <Field label="Machine ID" value={form.machineId} onChange={(v) => set("machineId", v)} />
          <div className="space-y-1.5">
            <Label>Machine Type</Label>
            <Select value={form.type} onValueChange={(v) => set("type", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <Field label="Factory Section" value={form.section} onChange={(v) => set("section", v)} />
          <Field label="Manufacturer" value={form.manufacturer} onChange={(v) => set("manufacturer", v)} />
          <Field label="Installation Date" type="date" value={form.installedOn} onChange={(v) => set("installedOn", v)} />
          <Field label="Last Maintenance" type="date" value={form.lastMaintenance} onChange={(v) => set("lastMaintenance", v)} />
          <Field
            label="Service Interval (days)"
            type="number"
            value={String(form.serviceIntervalDays)}
            onChange={(v) => set("serviceIntervalDays", Number(v) || 90)}
          />
          <div className="space-y-1.5 md:col-span-2">
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(v) => set("status", v as MachineStatus)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="healthy">Very Good Condition</SelectItem>
                <SelectItem value="warning1">Warning</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} className="bg-gradient-to-r from-primary to-info">Add Machine</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input type={type} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
