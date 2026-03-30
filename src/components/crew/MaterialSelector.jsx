import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, AlertTriangle, Package } from "lucide-react";
import { cn } from "@/lib/utils";

export default function MaterialSelector({ value = [], onChange }) {
  const [items, setItems] = useState([]);

  useEffect(() => {
    base44.entities.InventoryItem.list("name", 200).then(setItems);
  }, []);

  const addLine = () => onChange([...value, { inventory_item_id: "", quantity: "" }]);
  const removeLine = (i) => onChange(value.filter((_, idx) => idx !== i));
  const updateLine = (i, field, val) => {
    const updated = value.map((line, idx) => idx === i ? { ...line, [field]: val } : line);
    onChange(updated);
  };

  const getItem = (id) => items.find((i) => i.id === id);

  return (
    <div className="space-y-2">
      {value.map((line, i) => {
        const item = getItem(line.inventory_item_id);
        const isLow = item && item.quantity_in_stock <= item.reorder_threshold;
        const wouldEmpty = item && Number(line.quantity) >= item.quantity_in_stock;
        return (
          <div key={i} className="flex gap-2 items-start">
            <div className="flex-1">
              <select
                value={line.inventory_item_id}
                onChange={(e) => updateLine(i, "inventory_item_id", e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">Select item...</option>
                {items.map((it) => (
                  <option key={it.id} value={it.id}>
                    {it.name} ({it.quantity_in_stock} {it.unit} available)
                  </option>
                ))}
              </select>
              {item && (
                <div className="flex items-center gap-1 mt-0.5">
                  {(isLow || wouldEmpty) && (
                    <span className={cn("text-xs flex items-center gap-0.5", wouldEmpty ? "text-red-600" : "text-amber-600")}>
                      <AlertTriangle className="h-3 w-3" />
                      {wouldEmpty ? "Exceeds available stock!" : "Low stock after use"}
                    </span>
                  )}
                </div>
              )}
            </div>
            <div className="w-24">
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  min="0"
                  placeholder="Qty"
                  value={line.quantity}
                  onChange={(e) => updateLine(i, "quantity", e.target.value)}
                  className="h-9 text-sm"
                />
                {item && <span className="text-xs text-muted-foreground whitespace-nowrap">{item.unit}</span>}
              </div>
            </div>
            <Button type="button" variant="ghost" size="icon" className="h-9 w-9 text-destructive" onClick={() => removeLine(i)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        );
      })}
      <Button type="button" variant="outline" size="sm" className="gap-1.5 text-xs w-full" onClick={addLine}>
        <Plus className="h-3.5 w-3.5" />
        {value.length === 0 ? "Log Materials Used" : "Add Another Item"}
      </Button>
      {items.length === 0 && (
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <Package className="h-3 w-3" /> No inventory items set up yet.
        </p>
      )}
    </div>
  );
}
