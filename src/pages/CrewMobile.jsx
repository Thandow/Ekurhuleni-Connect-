import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import CrewTaskCard from "../components/crew/CrewTaskCard";
import CompletionModal from "../components/crew/CompletionModal";
import StatusBadge from "../components/StatusBadge";
import {
  HardHat, Bell, BellOff, Search, MapPin, Clock, Wrench,
  CheckCircle2, AlertTriangle, RefreshCw, Loader2, Navigation,
  X, ChevronDown, Phone
} from "lucide-react";
import { toast } from "sonner";
import moment from "moment";
import { cn } from "@/lib/utils";

const STATUS_FILTERS = ["All Active", "Pending", "Under Review", "In Progress"];

export default function CrewMobile() {
  const [teamName, setTeamName] = useState(() => localStorage.getItem("crew_team") || "");
  const [teamInput, setTeamInput] = useState("");
  const [faults, setFaults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("All Active");
  const [selectedFault, setSelectedFault] = useState(null);
  const [completionFault, setCompletionFault] = useState(null);
  const [notificationsOn, setNotificationsOn] = useState(true);
  const [newAlerts, setNewAlerts] = useState([]);
  const prevFaultsRef = useRef([]);
  const gpsIntervalRef = useRef(null);
  const locationRecordRef = useRef(null);

  const loadFaults = async (team) => {
    setLoading(true);
    const all = await base44.entities.FaultReport.list("-created_date", 200);
    const assigned = all.filter((f) =>
      f.assigned_team?.toLowerCase().includes(team.toLowerCase()) ||
      (f.status === "Pending" && !f.assigned_team)
    );
    // Detect new assignments
    if (prevFaultsRef.current.length > 0 && notificationsOn) {
      const prevIds = new Set(prevFaultsRef.current.map((f) => f.id));
      const newOnes = assigned.filter((f) => !prevIds.has(f.id));
      if (newOnes.length > 0) {
        setNewAlerts(newOnes);
        toast(`🔔 ${newOnes.length} new task${newOnes.length > 1 ? "s" : ""} assigned!`);
      }
    }
    prevFaultsRef.current = assigned;
    setFaults(assigned);
    setLoading(false);
  };

  // GPS broadcasting — push location every 15s when a fault is active
  const startGPSBroadcast = (team, faultId) => {
    if (!navigator.geolocation) return;
    stopGPSBroadcast();
    const broadcast = () => {
      navigator.geolocation.getCurrentPosition(async (pos) => {
        const payload = {
          team_name: team,
          fault_report_id: faultId,
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          heading: pos.coords.heading,
          speed: pos.coords.speed,
          last_updated: new Date().toISOString(),
        };
        if (locationRecordRef.current) {
          await base44.entities.CrewLocation.update(locationRecordRef.current, payload);
        } else {
          const existing = await base44.entities.CrewLocation.filter({ team_name: team }, "-last_updated", 1);
          if (existing.length > 0) {
            locationRecordRef.current = existing[0].id;
            await base44.entities.CrewLocation.update(existing[0].id, payload);
          } else {
            const created = await base44.entities.CrewLocation.create(payload);
            locationRecordRef.current = created.id;
          }
        }
      }, null, { enableHighAccuracy: true, timeout: 10000 });
    };
    broadcast();
    gpsIntervalRef.current = setInterval(broadcast, 15000);
  };

  const stopGPSBroadcast = () => {
    if (gpsIntervalRef.current) clearInterval(gpsIntervalRef.current);
    gpsIntervalRef.current = null;
  };

  useEffect(() => {
    if (!teamName) return;
    loadFaults(teamName);
    const interval = setInterval(() => loadFaults(teamName), 30000);
    return () => { clearInterval(interval); stopGPSBroadcast(); };
  }, [teamName]);

  // Start GPS when a fault is selected and In Progress
  useEffect(() => {
    if (selectedFault && selectedFault.status === "In Progress" && teamName) {
      startGPSBroadcast(teamName, selectedFault.id);
    } else {
      stopGPSBroadcast();
    }
  }, [selectedFault?.id, selectedFault?.status]);

  const handleLogin = () => {
    if (!teamInput.trim()) return;
    localStorage.setItem("crew_team", teamInput.trim());
    setTeamName(teamInput.trim());
  };

  const handleLogout = () => {
    localStorage.removeItem("crew_team");
    setTeamName("");
    setTeamInput("");
    setFaults([]);
    prevFaultsRef.current = [];
  };

  const filtered = faults.filter((f) => {
    if (statusFilter === "All Active") return f.status !== "Resolved" && f.status !== "Closed";
    return f.status === statusFilter;
  });

  const stats = {
    total: faults.length,
    pending: faults.filter((f) => f.status === "Pending").length,
    inProgress: faults.filter((f) => f.status === "In Progress").length,
    resolved: faults.filter((f) => f.status === "Resolved").length,
  };

  // Team Login Screen
  if (!teamName) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="h-16 w-16 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-4 shadow-lg">
              <HardHat className="h-8 w-8 text-primary-foreground" />
            </div>
            <h1 className="font-heading text-2xl font-bold">Crew Portal</h1>
            <p className="text-sm text-muted-foreground mt-1">Ekurhuleni Maintenance Interface</p>
          </div>

          <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Your Team Name</label>
              <Input
                value={teamInput}
                onChange={(e) => setTeamInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                placeholder="e.g., Roads Team Alpha"
                className="mt-2 h-11 text-sm"
                autoFocus
              />
            </div>
            <Button onClick={handleLogin} className="w-full h-11 gap-2" disabled={!teamInput.trim()}>
              <HardHat className="h-4 w-4" />
              Access My Tasks
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground mt-4">
            Enter the team name as assigned in the Admin Panel
          </p>
        </div>
      </div>
    );
  }

  // Fault Detail View
  if (selectedFault) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="sticky top-0 z-20 bg-card border-b border-border px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedFault(null)}>
            <X className="h-4 w-4" />
          </Button>
          <h2 className="font-heading font-semibold text-sm flex-1 truncate">Task Detail</h2>
          <StatusBadge status={selectedFault.status} />
        </div>

        <div className="p-4 space-y-4">
          {selectedFault.image_url && (
            <div className="rounded-xl overflow-hidden h-48">
              <img src={selectedFault.image_url} alt={selectedFault.title} className="w-full h-full object-cover" />
            </div>
          )}

          <div className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center gap-2 mb-2">
              {selectedFault.severity && <StatusBadge severity={selectedFault.severity} />}
              <span className="text-xs text-muted-foreground">{selectedFault.category}</span>
            </div>
            <h3 className="font-heading font-semibold text-base">{selectedFault.title}</h3>
            <p className="text-sm text-muted-foreground mt-2">{selectedFault.description}</p>
          </div>

          {/* Location Card */}
          <div className="bg-card rounded-xl border border-border p-4 space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Location</h4>
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium">{selectedFault.location_address}</p>
                <p className="text-xs text-muted-foreground">{selectedFault.location_area}, Ekurhuleni</p>
              </div>
            </div>
            <Button
              className="w-full gap-2 h-10"
              onClick={() => {
                const query = selectedFault.latitude && selectedFault.longitude
                  ? `${selectedFault.latitude},${selectedFault.longitude}`
                  : encodeURIComponent(`${selectedFault.location_address}, ${selectedFault.location_area}, Ekurhuleni`);
                window.open(`https://www.google.com/maps/dir/?api=1&destination=${query}`, "_blank");
              }}
            >
              <Navigation className="h-4 w-4" />
              Get GPS Directions
            </Button>
          </div>

          {/* Reporter */}
          {(selectedFault.reporter_name || selectedFault.reporter_contact) && (
            <div className="bg-card rounded-xl border border-border p-4">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Reported By</h4>
              <p className="text-sm font-medium">{selectedFault.reporter_name || "Anonymous"}</p>
              {selectedFault.reporter_contact && (
                <a href={`tel:${selectedFault.reporter_contact}`} className="flex items-center gap-1.5 text-sm text-primary mt-1">
                  <Phone className="h-3.5 w-3.5" />
                  {selectedFault.reporter_contact}
                </a>
              )}
            </div>
          )}

          {/* AI Analysis */}
          {selectedFault.ai_analysis && (
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-primary mb-2">AI Assessment</h4>
              <p className="text-xs text-muted-foreground">{selectedFault.ai_analysis}</p>
              <p className="text-xs text-primary mt-1 font-medium">Priority Score: {selectedFault.priority_score}/10</p>
            </div>
          )}

          {/* Meta */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            Reported {moment(selectedFault.created_date).format("DD MMM YYYY, HH:mm")}
          </div>

          {/* Action Buttons */}
          {selectedFault.status !== "Resolved" && selectedFault.status !== "Closed" && (
            <div className="space-y-2 pt-2">
              {selectedFault.status === "Pending" && (
                <Button
                  variant="outline"
                  className="w-full h-11 gap-2"
                  onClick={async () => {
                    await base44.entities.FaultReport.update(selectedFault.id, { status: "In Progress" });
                    setSelectedFault({ ...selectedFault, status: "In Progress" });
                    toast.success("Status updated to In Progress");
                    loadFaults(teamName);
                  }}
                >
                  <Wrench className="h-4 w-4" />
                  Mark as In Progress
                </Button>
              )}
              <Button
                className="w-full h-11 gap-2 bg-accent hover:bg-accent/90"
                onClick={() => setCompletionFault(selectedFault)}
              >
                <CheckCircle2 className="h-4 w-4" />
                Log Repair & Complete
              </Button>
            </div>
          )}
        </div>

        <CompletionModal
          fault={selectedFault}
          open={!!completionFault}
          onClose={() => setCompletionFault(null)}
          onUpdated={() => {
            setSelectedFault(null);
            loadFaults(teamName);
          }}
        />
      </div>
    );
  }

  // Main Task List
  return (
    <div className="min-h-screen bg-background pb-6">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-card border-b border-border">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <HardHat className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <p className="font-heading font-bold text-sm leading-tight">{teamName}</p>
              <p className="text-xs text-muted-foreground">Crew Portal</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setNotificationsOn(!notificationsOn)}
              className={cn("p-2 rounded-lg transition-colors", notificationsOn ? "text-primary bg-primary/10" : "text-muted-foreground")}
            >
              {notificationsOn ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
            </button>
            <button
              onClick={() => loadFaults(teamName)}
              className={cn("p-2 rounded-lg text-muted-foreground hover:text-foreground transition-colors", loading && "animate-spin")}
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            <button onClick={handleLogout} className="p-2 rounded-lg text-muted-foreground hover:text-destructive transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Status Filter Pills */}
        <div className="flex gap-2 px-4 pb-3 overflow-x-auto scrollbar-hide">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                "flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                statusFilter === s ? "bg-primary text-primary-foreground shadow" : "bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* New Alert Banner */}
        {newAlerts.length > 0 && (
          <div className="bg-primary/10 border border-primary/30 rounded-xl p-3 flex items-center gap-3">
            <Bell className="h-5 w-5 text-primary flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">
                {newAlerts.length} new task{newAlerts.length > 1 ? "s" : ""} assigned!
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {newAlerts.map((f) => f.title).join(", ")}
              </p>
            </div>
            <button onClick={() => setNewAlerts([])} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: "Total", value: stats.total, color: "text-foreground" },
            { label: "Pending", value: stats.pending, color: "text-amber-600" },
            { label: "Active", value: stats.inProgress, color: "text-blue-600" },
            { label: "Done", value: stats.resolved, color: "text-green-600" },
          ].map((s) => (
            <div key={s.label} className="bg-card rounded-xl border border-border p-2.5 text-center">
              <p className={cn("text-lg font-bold font-heading", s.color)}>{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Task List */}
        {loading && faults.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <CheckCircle2 className="h-10 w-10 text-accent mx-auto mb-3" />
            <p className="font-heading font-semibold">All clear!</p>
            <p className="text-sm text-muted-foreground mt-1">No tasks matching this filter.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((fault) => (
              <CrewTaskCard
                key={fault.id}
                fault={fault}
                onSelect={setSelectedFault}
                onNavigate={() => {}}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
