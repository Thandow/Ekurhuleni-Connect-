import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { 
  AlertTriangle, CheckCircle2, Clock, Wrench, FileText, 
  ArrowRight, PlusCircle, Loader2, Bell, X, BellDot
} from "lucide-react";
import moment from "moment";
import { Button } from "@/components/ui/button";
import StatsCard from "../components/StatsCard";
import FaultCard from "../components/FaultCard";
import CategoryChart from "../components/dashboard/CategoryChart";
import StatusChart from "../components/dashboard/StatusChart";
import SeverityChart from "../components/dashboard/SeverityChart";
import AreaChart from "../components/dashboard/AreaDistribution";

const STATUS_COLORS = {
  Pending: "bg-amber-100 text-amber-800 border-amber-200",
  "Under Review": "bg-blue-100 text-blue-800 border-blue-200",
  "In Progress": "bg-purple-100 text-purple-800 border-purple-200",
  Resolved: "bg-green-100 text-green-800 border-green-200",
  Closed: "bg-gray-100 text-gray-800 border-gray-200",
};

export default function Dashboard() {
  const [faults, setFaults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [showNotif, setShowNotif] = useState(false);
  const [unread, setUnread] = useState(0);
  const initialLoadDone = useRef(false);

  useEffect(() => {
    const load = async () => {
      const data = await base44.entities.FaultReport.list("-created_date", 200);
      setFaults(data);
      setLoading(false);
      initialLoadDone.current = true;
    };
    load();

    const unsubscribe = base44.entities.FaultReport.subscribe((event) => {
      if (!initialLoadDone.current) return;

      // Update faults list
      setFaults((prev) => {
        if (event.type === "create") return [event.data, ...prev];
        if (event.type === "update") return prev.map((f) => f.id === event.id ? event.data : f);
        if (event.type === "delete") return prev.filter((f) => f.id !== event.id);
        return prev;
      });

      // Add notification
      const label =
        event.type === "create" ? "New fault reported" :
        event.type === "update" ? `Fault updated → ${event.data?.status || "status changed"}` :
        "Fault removed";

      const notif = {
        id: Date.now(),
        type: event.type,
        label,
        title: event.data?.title || "Unknown fault",
        status: event.data?.status,
        faultId: event.id,
        time: new Date(),
      };

      setNotifications((prev) => [notif, ...prev].slice(0, 50));
      setUnread((n) => n + 1);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const total = faults.length;
  const pending = faults.filter((f) => f.status === "Pending").length;
  const inProgress = faults.filter((f) => f.status === "In Progress").length;
  const resolved = faults.filter((f) => f.status === "Resolved" || f.status === "Closed").length;
  const critical = faults.filter((f) => f.severity === "Critical" || f.severity === "High").length;
  const recentFaults = faults.slice(0, 6);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time overview of Ekurhuleni fault management
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Notification Bell */}
          <div className="relative">
            <button
              onClick={() => { setShowNotif((v) => !v); setUnread(0); }}
              className="relative h-9 w-9 rounded-lg border border-border bg-card flex items-center justify-center hover:bg-muted transition-colors"
            >
              {unread > 0 ? <BellDot className="h-5 w-5 text-primary" /> : <Bell className="h-5 w-5 text-muted-foreground" />}
              {unread > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </button>

            {/* Notification Dropdown */}
            {showNotif && (
              <div className="absolute right-0 top-11 z-50 w-80 bg-card border border-border rounded-xl shadow-xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                  <span className="font-heading font-semibold text-sm">Notifications</span>
                  <div className="flex items-center gap-2">
                    {notifications.length > 0 && (
                      <button onClick={() => setNotifications([])} className="text-xs text-muted-foreground hover:text-foreground">Clear all</button>
                    )}
                    <button onClick={() => setShowNotif(false)}><X className="h-4 w-4 text-muted-foreground" /></button>
                  </div>
                </div>
                <div className="max-h-80 overflow-y-auto divide-y divide-border">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-xs text-muted-foreground">
                      <Bell className="h-6 w-6 mx-auto mb-2 opacity-40" />
                      No notifications yet
                    </div>
                  ) : notifications.map((n) => (
                    <Link
                      key={n.id}
                      to={n.faultId ? `/faults/${n.faultId}` : "/faults"}
                      onClick={() => setShowNotif(false)}
                      className="flex items-start gap-3 px-4 py-3 hover:bg-muted/50 transition-colors"
                    >
                      <div className={`mt-0.5 h-2 w-2 rounded-full flex-shrink-0 ${
                        n.type === "create" ? "bg-green-500" : n.type === "delete" ? "bg-red-500" : "bg-blue-500"
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-foreground truncate">{n.title}</p>
                        <p className="text-xs text-muted-foreground">{n.label}</p>
                        {n.status && (
                          <span className={`inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded-full border font-medium ${STATUS_COLORS[n.status] || "bg-gray-100 text-gray-700"}`}>
                            {n.status}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap">{moment(n.time).fromNow()}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          <Link to="/report">
            <Button className="gap-2">
              <PlusCircle className="h-4 w-4" />
              Report Fault
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Total Reports" value={total} icon={FileText} subtitle="All time" />
        <StatsCard title="Pending" value={pending} icon={Clock} subtitle="Awaiting review" />
        <StatsCard title="In Progress" value={inProgress} icon={Wrench} subtitle="Being resolved" />
        <StatsCard title="Resolved" value={resolved} icon={CheckCircle2} subtitle="Completed" />
      </div>

      {/* Alert Banner */}
      {critical > 0 && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-foreground">{critical} High/Critical Severity Reports</p>
            <p className="text-xs text-muted-foreground">These require immediate attention from maintenance teams.</p>
          </div>
          <Link to="/faults" className="ml-auto">
            <Button variant="outline" size="sm" className="gap-1">
              View <ArrowRight className="h-3 w-3" />
            </Button>
          </Link>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <CategoryChart faults={faults} />
        <StatusChart faults={faults} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SeverityChart faults={faults} />
        <AreaChart faults={faults} />
      </div>

      {/* Recent Reports */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading font-semibold text-lg">Recent Reports</h2>
          <Link to="/faults" className="text-sm text-primary font-medium flex items-center gap-1 hover:underline">
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {recentFaults.map((fault) => (
            <FaultCard key={fault.id} fault={fault} />
          ))}
        </div>
        {recentFaults.length === 0 && (
          <div className="bg-card rounded-xl border border-border p-12 text-center">
            <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No fault reports yet.</p>
            <Link to="/report">
              <Button variant="outline" className="mt-3 gap-2">
                <PlusCircle className="h-4 w-4" /> Report the first fault
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
