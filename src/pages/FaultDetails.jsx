import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import CrewLocationMap from "../components/CrewLocationMap";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import StatusBadge from "../components/StatusBadge";
import { 
  ArrowLeft, MapPin, Calendar, User, Phone, Brain, 
  Loader2, Wrench, Clock, Save
} from "lucide-react";
import { toast } from "sonner";
import moment from "moment";

const statuses = ["Pending", "Under Review", "In Progress", "Resolved", "Closed"];

export default function FaultDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [fault, setFault] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newStatus, setNewStatus] = useState("");
  const [assignedTeam, setAssignedTeam] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      const data = await base44.entities.FaultReport.list("-created_date", 200);
      const found = data.find((f) => f.id === id);
      if (found) {
        setFault(found);
        setNewStatus(found.status);
        setAssignedTeam(found.assigned_team || "");
      }
      const allLogs = await base44.entities.MaintenanceLog.filter({ fault_report_id: id }, "-created_date", 50);
      setLogs(allLogs);
      setLoading(false);
    };
    load();
  }, [id]);

  const handleUpdate = async () => {
    setSaving(true);
    const updates = { status: newStatus, assigned_team: assignedTeam };
    if (newStatus === "Resolved") updates.resolved_date = new Date().toISOString();
    if (notes) updates.resolution_notes = notes;

    await base44.entities.FaultReport.update(id, updates);
    await base44.entities.MaintenanceLog.create({
      fault_report_id: id,
      action: `Status changed to ${newStatus}`,
      status_change: `${fault.status} → ${newStatus}`,
      notes: notes || "",
      performed_by: assignedTeam || "System",
    });

    // Notify resident by email if status changed and contact is an email
    if (newStatus !== fault.status && fault.reporter_contact && fault.reporter_contact.includes("@")) {
      const statusMessages = {
        "Under Review": "is now under review by our team",
        "In Progress": "is being actively worked on by our maintenance team",
        "Resolved": "has been resolved",
        "Closed": "has been closed",
      };
      const msg = statusMessages[newStatus];
      if (msg) {
        await base44.integrations.Core.SendEmail({
          to: fault.reporter_contact,
          subject: `Fault Report Update: ${fault.title}`,
          body: `Dear ${fault.reporter_name || "Resident"},\n\nYour fault report "${fault.title}" (${fault.category} in ${fault.location_area}) ${msg}.\n\nStatus: ${fault.status} → ${newStatus}\n${notes ? `Notes: ${notes}\n` : ""}\nThank you for helping us improve Ekurhuleni.\n\nEkurhuleni Metropolitan Municipality\nFault Management System`,
        });
      }
    }

    toast.success("Report updated successfully");
    setFault({ ...fault, ...updates });
    setNotes("");
    const allLogs = await base44.entities.MaintenanceLog.filter({ fault_report_id: id }, "-created_date", 50);
    setLogs(allLogs);
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!fault) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Fault report not found.</p>
        <Link to="/faults"><Button variant="outline" className="mt-4">Back to Reports</Button></Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link to="/faults" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to Reports
      </Link>

      {/* Header */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        {fault.image_url && (
          <div className="h-64 bg-muted">
            <img src={fault.image_url} alt={fault.title} className="w-full h-full object-cover" />
          </div>
        )}
        <div className="p-6">
          <div className="flex flex-wrap items-start gap-3 mb-4">
            <StatusBadge status={fault.status} />
            {fault.severity && <StatusBadge severity={fault.severity} />}
            <span className="text-xs bg-muted text-muted-foreground px-2.5 py-0.5 rounded-full">{fault.category}</span>
          </div>
          <h1 className="font-heading text-xl font-bold">{fault.title}</h1>
          <p className="text-sm text-muted-foreground mt-2">{fault.description}</p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-4 border-t border-border">
            <div className="flex items-center gap-2 text-xs">
              <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
              <div>
                <p className="text-muted-foreground">Location</p>
                <p className="font-medium">{fault.location_address}, {fault.location_area}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
              <div>
                <p className="text-muted-foreground">Reported</p>
                <p className="font-medium">{moment(fault.created_date).format("DD MMM YYYY, HH:mm")}</p>
              </div>
            </div>
            {fault.reporter_name && (
              <div className="flex items-center gap-2 text-xs">
                <User className="h-3.5 w-3.5 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground">Reporter</p>
                  <p className="font-medium">{fault.reporter_name}</p>
                </div>
              </div>
            )}
            {fault.reporter_contact && (
              <div className="flex items-center gap-2 text-xs">
                <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground">Contact</p>
                  <p className="font-medium">{fault.reporter_contact}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Crew Live Tracking */}
      {fault.assigned_team && (fault.status === "In Progress" || fault.status === "Under Review") && (
        <div className="bg-card rounded-xl border border-border p-6">
          <h2 className="font-heading font-semibold text-sm flex items-center gap-2 mb-4">
            <MapPin className="h-4 w-4 text-primary" /> Live Crew Tracking — {fault.assigned_team}
          </h2>
          <CrewLocationMap fault={fault} />
        </div>
      )}

      {/* AI Analysis */}
      {fault.ai_analysis && (
        <div className="bg-card rounded-xl border border-border p-6">
          <h2 className="font-heading font-semibold text-sm flex items-center gap-2 mb-3">
            <Brain className="h-4 w-4 text-primary" /> AI Analysis
          </h2>
          <p className="text-sm text-muted-foreground">{fault.ai_analysis}</p>
          <div className="flex items-center gap-4 mt-3 text-xs">
            <span>Confidence: <strong>{fault.ai_confidence}%</strong></span>
            <span>Priority Score: <strong>{fault.priority_score}/10</strong></span>
          </div>
        </div>
      )}

      {/* Update Section */}
      <div className="bg-card rounded-xl border border-border p-6 space-y-4">
        <h2 className="font-heading font-semibold text-sm flex items-center gap-2">
          <Wrench className="h-4 w-4" /> Manage Report
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label className="text-xs">Status</Label>
            <Select value={newStatus} onValueChange={setNewStatus}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>{statuses.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Assigned Team</Label>
            <Input value={assignedTeam} onChange={(e) => setAssignedTeam(e.target.value)} placeholder="e.g., Roads Team Alpha" className="mt-1" />
          </div>
        </div>
        <div>
          <Label className="text-xs">Notes</Label>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Add resolution notes or comments..." rows={3} className="mt-1" />
        </div>
        <Button onClick={handleUpdate} disabled={saving} className="gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Update Report
        </Button>
      </div>

      {/* Activity Log */}
      {logs.length > 0 && (
        <div className="bg-card rounded-xl border border-border p-6">
          <h2 className="font-heading font-semibold text-sm flex items-center gap-2 mb-4">
            <Clock className="h-4 w-4" /> Activity Log
          </h2>
          <div className="space-y-3">
            {logs.map((log) => (
              <div key={log.id} className="flex gap-3 text-xs">
                <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Wrench className="h-3 w-3 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">{log.action}</p>
                  {log.notes && <p className="text-muted-foreground mt-0.5">{log.notes}</p>}
                  <p className="text-muted-foreground mt-1">
                    {moment(log.created_date).format("DD MMM YYYY, HH:mm")} • {log.performed_by || "System"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
