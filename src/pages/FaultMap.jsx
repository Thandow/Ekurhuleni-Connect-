import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from "react-leaflet";
import { Link } from "react-router-dom";
import StatusBadge from "../components/StatusBadge";
import { Loader2, MapPin, ArrowRight, Layers, Thermometer, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const SEVERITY_COLORS = {
  Critical: { fill: "#ef4444", stroke: "#b91c1c" },
  High: { fill: "#f97316", stroke: "#c2410c" },
  Medium: { fill: "#eab308", stroke: "#a16207" },
  Low: { fill: "#22c55e", stroke: "#15803d" },
};

// Ekurhuleni center coordinates
const EKURHULENI_CENTER = [-26.195, 28.305];

export default function FaultMap() {
  const [faults, setFaults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [severityFilter, setSeverityFilter] = useState("All"); // All | Critical | High

  useEffect(() => {
    const load = async () => {
      const data = await base44.entities.FaultReport.list("-created_date", 200);
      setFaults(data.filter((f) => f.latitude && f.longitude));
      setLoading(false);
    };
    load();
  }, []);

  const filteredFaults = faults.filter((f) => {
    if (severityFilter === "Critical") return f.severity === "Critical";
    if (severityFilter === "High") return f.severity === "High" || f.severity === "Critical";
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Fault Map</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Geographic distribution of reported faults across Ekurhuleni
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex items-center gap-2 bg-card border border-border rounded-lg p-1">
          <button
            onClick={() => setSeverityFilter("All")}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              severityFilter === "All" ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            All Faults
          </button>
          <button
            onClick={() => setSeverityFilter("High")}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${
              severityFilter === "High" ? "bg-orange-500 text-white shadow" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <AlertTriangle className="h-3 w-3" /> High & Critical
          </button>
          <button
            onClick={() => setSeverityFilter("Critical")}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${
              severityFilter === "Critical" ? "bg-red-500 text-white shadow" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <AlertTriangle className="h-3 w-3" /> Critical Only
          </button>
        </div>

        <button
          onClick={() => setShowHeatmap(!showHeatmap)}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
            showHeatmap ? "bg-primary/10 border-primary/30 text-primary" : "bg-card border-border text-muted-foreground hover:text-foreground"
          }`}
        >
          <Thermometer className="h-3.5 w-3.5" />
          {showHeatmap ? "Heatmap On" : "Heatmap Off"}
        </button>

        <span className="text-xs text-muted-foreground ml-auto">
          Showing {filteredFaults.length} fault{filteredFaults.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mb-4">
        {Object.entries(SEVERITY_COLORS).map(([sev, colors]) => (
          <div key={sev} className="flex items-center gap-1.5 text-xs">
            <span className="h-3 w-3 rounded-full inline-block" style={{ background: colors.fill }} />
            {sev}
          </div>
        ))}
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden" style={{ height: "calc(100vh - 320px)", minHeight: "400px" }}>
        {faults.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-heading font-semibold text-lg">No Geolocated Reports</h3>
            <p className="text-sm text-muted-foreground mt-2 max-w-md">
              Reports with GPS coordinates will appear here on the map.
            </p>
          </div>
        ) : (
          <MapContainer center={EKURHULENI_CENTER} zoom={11} style={{ height: "100%", width: "100%" }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {/* Heatmap layer - large translucent circles */}
            {showHeatmap && filteredFaults.map((fault) => (
              <CircleMarker
                key={`heat-${fault.id}`}
                center={[fault.latitude, fault.longitude]}
                radius={40}
                pathOptions={{
                  fillColor: SEVERITY_COLORS[fault.severity]?.fill || "#3b82f6",
                  fillOpacity: 0.12,
                  stroke: false,
                }}
              />
            ))}
            {/* Individual fault markers */}
            {filteredFaults.map((fault) => {
              const colors = SEVERITY_COLORS[fault.severity] || { fill: "#3b82f6", stroke: "#1d4ed8" };
              return (
                <CircleMarker
                  key={fault.id}
                  center={[fault.latitude, fault.longitude]}
                  radius={8}
                  pathOptions={{
                    fillColor: colors.fill,
                    fillOpacity: 0.9,
                    color: colors.stroke,
                    weight: 2,
                  }}
                >
                  <Popup>
                    <div className="text-xs space-y-1 min-w-[200px]">
                      <p className="font-semibold text-sm">{fault.title}</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <StatusBadge status={fault.status} />
                        {fault.severity && <StatusBadge severity={fault.severity} />}
                      </div>
                      <p className="text-muted-foreground">{fault.category}</p>
                      <p className="text-muted-foreground">{fault.location_area}</p>
                      <Link to={`/faults/${fault.id}`}>
                        <Button size="sm" variant="outline" className="mt-2 gap-1 text-xs h-7 w-full">
                          View Details <ArrowRight className="h-3 w-3" />
                        </Button>
                      </Link>
                    </div>
                  </Popup>
                </CircleMarker>
              );
            })}
          </MapContainer>
        )}
      </div>
    </div>
  );
}
