import { Link } from "react-router-dom";
import { MapPin, Calendar, ArrowRight } from "lucide-react";
import StatusBadge from "./StatusBadge";
import { cn } from "@/lib/utils";
import moment from "moment";

const categoryIcons = {
  "Pothole": "🕳️",
  "Burst Water Pipe": "💧",
  "Streetlight Failure": "💡",
  "Illegal Dumping": "🗑️",
  "Other": "⚠️",
};

export default function FaultCard({ fault, compact }) {
  return (
    <Link
      to={`/faults/${fault.id}`}
      className={cn(
        "group block bg-card rounded-xl border border-border overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5",
        compact && "flex items-center gap-4 p-3"
      )}
    >
      {!compact && fault.image_url && (
        <div className="h-40 overflow-hidden bg-muted">
          <img src={fault.image_url} alt={fault.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        </div>
      )}
      <div className={cn(!compact && "p-4")}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{categoryIcons[fault.category] || "⚠️"}</span>
              <span className="text-xs font-medium text-muted-foreground">{fault.category}</span>
            </div>
            <h3 className="font-heading font-semibold text-sm text-foreground truncate">{fault.title}</h3>
          </div>
          <StatusBadge status={fault.status} />
        </div>
        {!compact && (
          <>
            <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{fault.description}</p>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {fault.location_area || "Unknown"}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {moment(fault.created_date).fromNow()}
                </span>
              </div>
              {fault.severity && <StatusBadge severity={fault.severity} />}
            </div>
          </>
        )}
      </div>
    </Link>
  );
}
