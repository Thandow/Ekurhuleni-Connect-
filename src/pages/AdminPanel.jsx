import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import StatusBadge from "../components/StatusBadge";
import { 
  Loader2, Search, Users, AlertTriangle, CheckCircle2, 
  Clock, ArrowUpDown, Send, Trash2
} from "lucide-react";
import { toast } from "sonner";
import moment from "moment";
import { Link } from "react-router-dom";

const statuses = ["Pending", "Under Review", "In Progress", "Resolved", "Closed"];

export default function AdminPanel() {
  const [faults, setFaults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [bulkStatus, setBulkStatus] = useState("");
  const [selected, setSelected] = useState(new Set());

  useEffect(() => {
    loadFaults();
  }, []);

  const loadFaults = async () => {
    const data = await base44.entities.FaultReport.list("-created_date", 200);
    setFaults(data);
    setLoading(false);
  };

  const toggleSelect = (id) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };

  const selectAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((f) => f.id)));
    }
  };

  const bulkUpdate = async () => {
    if (!bulkStatus || selected.size === 0) return;
    for (const id of selected) {
      await base44.entities.FaultReport.update(id, { status: bulkStatus });
    }
    toast.success(`Updated ${selected.size} reports to ${bulkStatus}`);
    setSelected(new Set());
    setBulkStatus("");
    loadFaults();
  };

  const deleteFault = async (id) => {
    await base44.entities.FaultReport.delete(id);
    toast.success("Report deleted");
    loadFaults();
  };

  const filtered = faults
    .filter((f) => {
      if (!search) return true;
      const s = search.toLowerCase();
      return f.title?.toLowerCase().includes(s) || f.location_area?.toLowerCase().includes(s) || f.category?.toLowerCase().includes(s);
    })
    .sort((a, b) => {
      if (sortBy === "newest") return new Date(b.created_date) - new Date(a.created_date);
      if (sortBy === "oldest") return new Date(a.created_date) - new Date(b.created_date);
      if (sortBy === "priority") return (b.priority_score || 0) - (a.priority_score || 0);
      return 0;
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
        <h1 className="font-heading text-2xl font-bold text-foreground">Admin Panel</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage and process fault reports</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-center">
          <Clock className="h-4 w-4 text-amber-600 mx-auto" />
          <p className="text-lg font-bold text-amber-800 mt-1">{faults.filter((f) => f.status === "Pending").length}</p>
          <p className="text-xs text-amber-600">Pending</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
          <Users className="h-4 w-4 text-blue-600 mx-auto" />
          <p className="text-lg font-bold text-blue-800 mt-1">{faults.filter((f) => f.status === "In Progress").length}</p>
          <p className="text-xs text-blue-600">In Progress</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
          <AlertTriangle className="h-4 w-4 text-red-600 mx-auto" />
          <p className="text-lg font-bold text-red-800 mt-1">{faults.filter((f) => f.severity === "Critical").length}</p>
          <p className="text-xs text-red-600">Critical</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
          <CheckCircle2 className="h-4 w-4 text-green-600 mx-auto" />
          <p className="text-lg font-bold text-green-800 mt-1">{faults.filter((f) => f.status === "Resolved").length}</p>
          <p className="text-xs text-green-600">Resolved</p>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-card rounded-xl border border-border p-4">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-40">
              <ArrowUpDown className="h-3 w-3 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="priority">Priority</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Bulk Actions */}
        {selected.size > 0 && (
          <div className="flex items-center gap-3 mt-3 pt-3 border-t border-border">
            <span className="text-xs font-medium">{selected.size} selected</span>
            <Select value={bulkStatus} onValueChange={setBulkStatus}>
              <SelectTrigger className="w-40 h-8 text-xs"><SelectValue placeholder="Change status" /></SelectTrigger>
              <SelectContent>{statuses.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
            <Button size="sm" onClick={bulkUpdate} disabled={!bulkStatus} className="gap-1 h-8 text-xs">
              <Send className="h-3 w-3" /> Apply
            </Button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="p-3 text-left">
                  <input type="checkbox" checked={selected.size === filtered.length && filtered.length > 0} onChange={selectAll} className="rounded" />
                </th>
                <th className="p-3 text-left font-medium text-muted-foreground">Report</th>
                <th className="p-3 text-left font-medium text-muted-foreground hidden sm:table-cell">Category</th>
                <th className="p-3 text-left font-medium text-muted-foreground hidden md:table-cell">Area</th>
                <th className="p-3 text-left font-medium text-muted-foreground">Status</th>
                <th className="p-3 text-left font-medium text-muted-foreground hidden lg:table-cell">Severity</th>
                <th className="p-3 text-left font-medium text-muted-foreground hidden lg:table-cell">Date</th>
                <th className="p-3 text-left font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((fault) => (
                <tr key={fault.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                  <td className="p-3">
                    <input type="checkbox" checked={selected.has(fault.id)} onChange={() => toggleSelect(fault.id)} className="rounded" />
                  </td>
                  <td className="p-3">
                    <Link to={`/faults/${fault.id}`} className="font-medium text-foreground hover:text-primary transition-colors">
                      {fault.title}
                    </Link>
                  </td>
                  <td className="p-3 hidden sm:table-cell text-muted-foreground">{fault.category}</td>
                  <td className="p-3 hidden md:table-cell text-muted-foreground">{fault.location_area}</td>
                  <td className="p-3"><StatusBadge status={fault.status} /></td>
                  <td className="p-3 hidden lg:table-cell">{fault.severity && <StatusBadge severity={fault.severity} />}</td>
                  <td className="p-3 hidden lg:table-cell text-muted-foreground">{moment(fault.created_date).format("DD MMM")}</td>
                  <td className="p-3">
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => deleteFault(fault.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="p-12 text-center text-muted-foreground text-sm">No reports found.</div>
        )}
      </div>
    </div>
  );
}
