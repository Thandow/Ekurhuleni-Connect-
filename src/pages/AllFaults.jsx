import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, Loader2, FileText } from "lucide-react";
import FaultCard from "../components/FaultCard";

const categories = ["All", "Pothole", "Burst Water Pipe", "Streetlight Failure", "Illegal Dumping", "Other"];
const statuses = ["All", "Pending", "Under Review", "In Progress", "Resolved", "Closed"];
const severities = ["All", "Low", "Medium", "High", "Critical"];

export default function AllFaults() {
  const [faults, setFaults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [severityFilter, setSeverityFilter] = useState("All");

  useEffect(() => {
    const load = async () => {
      const data = await base44.entities.FaultReport.list("-created_date", 200);
      setFaults(data);
      setLoading(false);
    };
    load();
  }, []);

  const filtered = faults.filter((f) => {
    const matchSearch = !search || f.title?.toLowerCase().includes(search.toLowerCase()) || f.description?.toLowerCase().includes(search.toLowerCase()) || f.location_area?.toLowerCase().includes(search.toLowerCase());
    const matchCategory = categoryFilter === "All" || f.category === categoryFilter;
    const matchStatus = statusFilter === "All" || f.status === statusFilter;
    const matchSeverity = severityFilter === "All" || f.severity === severityFilter;
    return matchSearch && matchCategory && matchStatus && matchSeverity;
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
        <h1 className="font-heading text-2xl font-bold text-foreground">All Fault Reports</h1>
        <p className="text-sm text-muted-foreground mt-1">{faults.length} total reports</p>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-xl border border-border p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search reports..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{categories.map((c) => <SelectItem key={c} value={c}>{c === "All" ? "All Categories" : c}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{statuses.map((s) => <SelectItem key={s} value={s}>{s === "All" ? "All Statuses" : s}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={severityFilter} onValueChange={setSeverityFilter}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{severities.map((s) => <SelectItem key={s} value={s}>{s === "All" ? "All Severities" : s}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>

      {/* Results */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((fault) => (
            <FaultCard key={fault.id} fault={fault} />
          ))}
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border p-12 text-center">
          <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No fault reports match your filters.</p>
        </div>
      )}
    </div>
  );
}
