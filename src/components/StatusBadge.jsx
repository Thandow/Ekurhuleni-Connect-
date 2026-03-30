import { cn } from "@/lib/utils";
import { Clock, Eye, Wrench, CheckCircle2, XCircle } from "lucide-react";

const statusConfig = {
  Pending: { color: "bg-amber-100 text-amber-800 border-amber-200", icon: Clock },
  "Under Review": { color: "bg-blue-100 text-blue-800 border-blue-200", icon: Eye },
  "In Progress": { color: "bg-purple-100 text-purple-800 border-purple-200", icon: Wrench },
  Resolved: { color: "bg-green-100 text-green-800 border-green-200", icon: CheckCircle2 },
  Closed: { color: "bg-gray-100 text-gray-800 border-gray-200", icon: XCircle },
};

const severityConfig = {
  Low: "bg-green-100 text-green-800 border-green-200",
  Medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
  High: "bg-orange-100 text-orange-800 border-orange-200",
  Critical: "bg-red-100 text-red-800 border-red-200",
};

export default function StatusBadge({ status, severity, className }) {
  if (severity) {
    return (
      <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border", severityConfig[severity] || severityConfig.Low, className)}>
        {severity}
      </span>
    );
  }

  const config = statusConfig[status] || statusConfig.Pending;
  const Icon = config.icon;

  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border", config.color, className)}>
      <Icon className="h-3 w-3" />
      {status}
    </span>
  );
}
