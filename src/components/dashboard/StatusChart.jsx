import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import _ from "lodash";

const STATUS_ORDER = ["Pending", "Under Review", "In Progress", "Resolved", "Closed"];

export default function StatusChart({ faults }) {
  const counts = _.countBy(faults, "status");
  const data = STATUS_ORDER.map((status) => ({
    name: status,
    count: counts[status] || 0,
  }));

  return (
    <div className="bg-card rounded-xl border border-border p-5">
      <h3 className="font-heading font-semibold text-sm mb-4">Reports by Status</h3>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} barSize={32}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 32%, 91%)" />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
          <Tooltip contentStyle={{ borderRadius: "8px", fontSize: "12px", border: "1px solid hsl(214, 32%, 91%)" }} />
          <Bar dataKey="count" fill="hsl(217, 91%, 40%)" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
