import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";
import _ from "lodash";

const SEVERITY_COLORS = {
  Low: "hsl(152, 60%, 42%)",
  Medium: "hsl(38, 92%, 50%)",
  High: "hsl(25, 95%, 53%)",
  Critical: "hsl(0, 84%, 60%)",
};

export default function SeverityChart({ faults }) {
  const counts = _.countBy(faults, "severity");
  const data = ["Low", "Medium", "High", "Critical"].map((sev) => ({
    name: sev,
    count: counts[sev] || 0,
  }));

  return (
    <div className="bg-card rounded-xl border border-border p-5">
      <h3 className="font-heading font-semibold text-sm mb-4">Severity Distribution</h3>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} barSize={40}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 32%, 91%)" />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
          <Tooltip contentStyle={{ borderRadius: "8px", fontSize: "12px", border: "1px solid hsl(214, 32%, 91%)" }} />
          <Bar dataKey="count" radius={[6, 6, 0, 0]}>
            {data.map((entry) => (
              <Cell key={entry.name} fill={SEVERITY_COLORS[entry.name]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
