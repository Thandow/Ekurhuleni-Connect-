import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import _ from "lodash";

export default function AreaDistribution({ faults }) {
  const data = _.chain(faults)
    .countBy("location_area")
    .map((count, name) => ({ name: name || "Unknown", count }))
    .orderBy("count", "desc")
    .take(8)
    .value();

  if (data.length === 0) return null;

  return (
    <div className="bg-card rounded-xl border border-border p-5">
      <h3 className="font-heading font-semibold text-sm mb-4">Top Areas by Reports</h3>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} layout="vertical" barSize={20}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 32%, 91%)" />
          <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
          <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={80} />
          <Tooltip contentStyle={{ borderRadius: "8px", fontSize: "12px", border: "1px solid hsl(214, 32%, 91%)" }} />
          <Bar dataKey="count" fill="hsl(152, 60%, 42%)" radius={[0, 6, 6, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
