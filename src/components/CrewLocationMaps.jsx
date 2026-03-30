import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { MapContainer, TileLayer, CircleMarker, Marker, Popup, Polyline } from "react-leaflet";
import { Navigation2, Wifi, WifiOff, Clock } from "lucide-react";
import moment from "moment";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const EKURHULENI_CENTER = [-26.195, 28.305];

export default function CrewLocationMap({ fault }) {
  const [crewLocation, setCrewLocation] = useState(null);
  const [online, setOnline] = useState(false);
  const intervalRef = useRef(null);

  const faultCenter = fault.latitude && fault.longitude
    ? [fault.latitude, fault.longitude]
    : null;

  const fetchCrewLocation = async () => {
    if (!fault.assigned_team) return;
    const results = await base44.entities.CrewLocation.filter(
      { team_name: fault.assigned_team },
      "-last_updated",
      1
    );
    if (results.length > 0) {
      const loc = results[0];
      setCrewLocation(loc);
      // Consider online if updated within last 2 minutes
      const age = Date.now() - new Date(loc.last_updated).getTime();
      setOnline(age < 120000);
    }
  };

  useEffect(() => {
    fetchCrewLocation();
    intervalRef.current = setInterval(fetchCrewLocation, 10000);
    return () => clearInterval(intervalRef.current);
  }, [fault.assigned_team]);

  const crewPos = crewLocation?.latitude && crewLocation?.longitude
    ? [crewLocation.latitude, crewLocation.longitude]
    : null;

  const mapCenter = crewPos || faultCenter || EKURHULENI_CENTER;

  return (
    <div className="space-y-3">
      {/* Status Bar */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          {online ? (
            <span className="flex items-center gap-1.5 text-green-600 font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
              </span>
              <Wifi className="h-3 w-3" /> Live — {fault.assigned_team}
            </span>
          ) : crewLocation ? (
            <span className="flex items-center gap-1.5 text-amber-600 font-medium">
              <WifiOff className="h-3 w-3" /> Last seen {moment(crewLocation.last_updated).fromNow()}
            </span>
          ) : (
            <span className="text-muted-foreground">Waiting for crew location...</span>
          )}
        </div>
        {crewLocation && (
          <span className="flex items-center gap-1 text-muted-foreground">
            <Clock className="h-3 w-3" />
            Updated {moment(crewLocation.last_updated).fromNow()}
          </span>
        )}
      </div>

      {/* Map */}
      <div className="rounded-xl overflow-hidden border border-border" style={{ height: 300 }}>
        <MapContainer center={mapCenter} zoom={14} style={{ height: "100%", width: "100%" }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Fault location marker */}
          {faultCenter && (
            <>
              <CircleMarker
                center={faultCenter}
                radius={14}
                pathOptions={{ fillColor: "#ef4444", fillOpacity: 0.15, color: "#ef4444", weight: 2 }}
              />
              <CircleMarker
                center={faultCenter}
                radius={7}
                pathOptions={{ fillColor: "#ef4444", fillOpacity: 0.9, color: "#b91c1c", weight: 2 }}
              >
                <Popup>
                  <p className="font-semibold text-xs">{fault.title}</p>
                  <p className="text-xs text-gray-500">{fault.location_address}</p>
                </Popup>
              </CircleMarker>
            </>
          )}

          {/* Crew location marker */}
          {crewPos && (
            <>
              {/* Line from crew to fault */}
              {faultCenter && (
                <Polyline
                  positions={[crewPos, faultCenter]}
                  pathOptions={{ color: "#3b82f6", weight: 2, dashArray: "6 4", opacity: 0.6 }}
                />
              )}
              <CircleMarker
                center={crewPos}
                radius={14}
                pathOptions={{ fillColor: "#3b82f6", fillOpacity: 0.15, color: "#3b82f6", weight: 2 }}
              />
              <CircleMarker
                center={crewPos}
                radius={7}
                pathOptions={{
                  fillColor: online ? "#22c55e" : "#f59e0b",
                  fillOpacity: 0.95,
                  color: online ? "#15803d" : "#b45309",
                  weight: 2,
                }}
              >
                <Popup>
                  <p className="font-semibold text-xs flex items-center gap-1">
                    <Navigation2 className="h-3 w-3" /> {crewLocation.team_name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {online ? "Live location" : `Last seen ${moment(crewLocation.last_updated).fromNow()}`}
                  </p>
                </Popup>
              </CircleMarker>
            </>
          )}
        </MapContainer>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full bg-red-500 inline-block" /> Fault location
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full bg-green-500 inline-block" /> Crew (live)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full bg-amber-500 inline-block" /> Crew (offline)
        </span>
      </div>
    </div>
  );
}
