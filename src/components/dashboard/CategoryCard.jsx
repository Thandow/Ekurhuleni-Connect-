import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import _ from "lodash";

const COLORS = ["hsl(217, 91%, 40%)", "hsl(152, 60%, 42%)", "hsl(38, 92%, 50%)", "hsl(0, 84%, 60%)", "hsl(262, 52%, 47%)"];

export default function CategoryChart({ faults }) {
  const data = _.chain(faults)
    .countBy("category")
    .map((count, name) => ({ name, value: count }))
    .orderBy("value", "desc")
    .value();

  if (data.length === 0) return null;

  return (
    <div className="bg-card rounded-xl border border-border p-5">
      <h3 className="font-heading font-semibold text-sm mb-4">Faults by Category</h3>
      <ResponsiveContainer width="100%" height={240}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value">
            {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Pie>
          <Tooltip contentStyle={{ borderRadius: "8px", fontSize: "12px", border: "1px solid hsl(214, 32%, 91%)" }} />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "12px" }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
