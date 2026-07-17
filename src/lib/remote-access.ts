export type ConnectivityMode = "network" | "bluetooth" | "offline-wired";
export type ConnectionReadiness = "ready" | "limited" | "offline";
export type ClientPlatform = "Laptop" | "Mobile";

export interface RemoteAccessOption {
  id: string;
  mode: ConnectivityMode;
  label: string;
  description: string;
  readiness: ConnectionReadiness;
  endpoint: string;
  security: string;
  clientSupport: ClientPlatform[];
  pairingCode?: string;
  instructions: string[];
}

export interface RemoteAccessSession {
  id: string;
  machineId: string;
  machineName: string;
  mode: ConnectivityMode;
  platform: ClientPlatform;
  status: "ready" | "connecting" | "connected";
  endpoint: string;
  instructions: string[];
  startedAt: string;
}

function resolveEndpoint(machineId: string, mode: ConnectivityMode) {
  switch (mode) {
    case "network":
      return `https://ops.local/machines/${machineId}/live`;
    case "bluetooth":
      return `bt://factory/${machineId}`;
    case "offline-wired":
      return `usb://serial/${machineId}`;
    default:
      return `local://${machineId}`;
  }
}

function getSecurity(mode: ConnectivityMode) {
  switch (mode) {
    case "network":
      return "TLS + signed session token";
    case "bluetooth":
      return "Bluetooth pairing + rotating PIN";
    case "offline-wired":
      return "Physical cable verification";
    default:
      return "Local-only access";
  }
}

export function buildRemoteAccessPlan(machine: {
  id: string;
  name: string;
  status: string;
  healthScore: number;
  power: number;
}) {
  const isMachineOff = machine.status === "off";
  const isCritical = machine.status === "critical" || machine.healthScore < 50;
  const networkReady = !isMachineOff && machine.power > 0;

  const options: RemoteAccessOption[] = [
    {
      id: `${machine.id}-network`,
      mode: "network",
      label: "Local network access",
      description: "Secure remote control over LAN or VPN for laptop and mobile clients.",
      readiness: networkReady ? "ready" : "offline",
      endpoint: resolveEndpoint(machine.id, "network"),
      security: getSecurity("network"),
      clientSupport: ["Laptop", "Mobile"],
      instructions: [
        "Enable VPN or LAN reachability.",
        "Open the session link from the laptop or mobile device.",
      ],
    },
    {
      id: `${machine.id}-bluetooth`,
      mode: "bluetooth",
      label: "Bluetooth bridge",
      description: "Short-range session for maintenance tablets and phones near the machine.",
      readiness: isMachineOff ? "offline" : isCritical ? "limited" : "ready",
      endpoint: resolveEndpoint(machine.id, "bluetooth"),
      security: getSecurity("bluetooth"),
      clientSupport: ["Laptop", "Mobile"],
      pairingCode: "4821",
      instructions: [
        "Pair the device with the machine bridge.",
        "Confirm the one-time PIN shown on the control panel.",
      ],
    },
    {
      id: `${machine.id}-offline`,
      mode: "offline-wired",
      label: "Offline wired access",
      description: "Direct cable-based diagnostics for environments with no wireless coverage.",
      readiness: "ready",
      endpoint: resolveEndpoint(machine.id, "offline-wired"),
      security: getSecurity("offline-wired"),
      clientSupport: ["Laptop"],
      instructions: [
        "Connect the industrial cable adapter to the machine port.",
        "Open the local console from the laptop to inspect diagnostics.",
      ],
    },
  ];

  return options;
}

export function createRemoteAccessSession(
  machine: { id: string; name: string },
  mode: ConnectivityMode,
  platform: ClientPlatform,
): RemoteAccessSession {
  return {
    id: `${machine.id}-${mode}-${platform.toLowerCase()}`,
    machineId: machine.id,
    machineName: machine.name,
    mode,
    platform,
    status: "ready",
    endpoint: resolveEndpoint(machine.id, mode),
    instructions:
      mode === "network"
        ? ["Session ready for remote monitoring.", "Use the laptop or mobile client to stream live telemetry."]
        : mode === "bluetooth"
          ? ["Pairing complete. Use the attached controller to inspect the machine state."]
          : ["Wired console started. Diagnostics are available locally without network access."],
    startedAt: new Date().toISOString(),
  };
}
