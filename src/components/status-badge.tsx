import { type MachineStatus, statusLabel, statusColor } from "@/lib/store";
import { cn } from "@/lib/utils";

export function StatusBadge({ status }: { status: MachineStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium",
        statusColor(status),
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          status === "healthy" && "bg-success",
          status === "good" && "bg-info",
          (status === "warning1" || status === "warning2") && "bg-warning",
          status === "critical" && "bg-destructive animate-pulse",
          status === "off" && "bg-muted-foreground",
        )}
      />
      {statusLabel(status)}
    </span>
  );
}
