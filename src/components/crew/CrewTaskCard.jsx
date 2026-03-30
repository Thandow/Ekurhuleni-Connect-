import { MapPin, Clock, Navigation, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import StatusBadge from "../StatusBadge";
import { cn } from "@/lib/utils";
import moment from "moment";

const CATEGORY_ICONS = {
  "Pothole": "🕳️",
  "Burst Water Pipe": "💧",
  "Streetlight Failure": "💡",
  "Illegal Dumping": "🗑️",
  "Other": "⚠️",
};

const SEVERITY_BORDER = {
  Critical: "border-l-red-500",
  High: "border-l-orange-500",
  Medium: "border-l-yellow-500",
  Low: "border-l-green-500",
};

export default function CrewTaskCard({ fault, onSelect, onNavigate }) {
  const borderColor = SEVERITY_BORDER[fault.severity] || "border-l-border";

  const openGPS = (e) => {
    e.stopPropagation();
    const query = fault.latitude && fault.longitude
      ? `${fault.latitude},${fault.longitude}`
      : encodeURIComponent(`${fault.location_address}, ${fault.location_area}, Ekurhuleni`);
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${query}`, "_blank");
    onNavigate?.(fault);
  };

  return (
    <div
      onClick={() => onSelect(fault)}
      className={cn(
        "bg-card rounded-xl border border-border border-l-4 p-4 cursor-pointer active:scale-[0.98] transition-all duration-150 shadow-sm",
        borderColor
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-base">{CATEGORY_ICONS[fault.category] || "⚠️"}</span>
            <span className="text-xs font-medium text-muted-foreground">{fault.category}</span>
            {fault.severity && <StatusBadge severity={fault.severity} className="ml-auto" />}
          </div>
          <h3 className="font-heading font-semibold text-sm text-foreground leading-tight">{fault.title}</h3>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
      </div>

      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <MapPin className="h-3 w-3" />
          {fault.location_address ? `${fault.location_address.slice(0, 25)}...` : fault.location_area}
        </span>
        <span className="flex items-center gap-1 ml-auto">
          <Clock className="h-3 w-3" />
          {moment(fault.created_date).fromNow()}
        </span>
      </div>

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
        <StatusBadge status={fault.status} />
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5 h-7 text-xs border-primary/30 text-primary hover:bg-primary/5"
          onClick={openGPS}
        >
          <Navigation className="h-3 w-3" />
          Navigate
        </Button>
      </div>
    </div>
  );
}
