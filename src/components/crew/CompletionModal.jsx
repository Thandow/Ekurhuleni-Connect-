import { useState } from "react";
import MaterialSelector from "./MaterialSelector";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, Upload, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function CompletionModal({ fault, open, onClose, onUpdated }) {
  const [notes, setNotes] = useState("");
  const [materialUsed, setMaterialUsed] = useState("");
  const [hoursSpent, setHoursSpent] = useState("");
  const [newStatus, setNewStatus] = useState("Resolved");
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [saving, setSaving] = useState(false);

  const handlePhoto = (e) => {
    const file = e.target.files?.[0];
    if (file) { setPhotoFile(file); setPhotoPreview(URL.createObjectURL(file)); }
  };

  const handleSubmit = async () => {
    if (!notes) { toast.error("Please add completion notes"); return; }
    setSaving(true);

    let photoUrl = "";
    if (photoFile) {
      const uploaded = await base44.integrations.Core.UploadFile({ file: photoFile });
      photoUrl = uploaded.file_url;
    }

    // Decrement inventory stock and log material usage
    for (const line of materials) {
      if (!line.inventory_item_id || !line.quantity) continue;
      const qty = Number(line.quantity);
      const item = await base44.entities.InventoryItem.filter({ id: line.inventory_item_id }, "-created_date", 1);
      if (item.length > 0) {
        const newStock = Math.max(0, item[0].quantity_in_stock - qty);
        await base44.entities.InventoryItem.update(line.inventory_item_id, { quantity_in_stock: newStock });
        await base44.entities.MaterialUsage.create({
          fault_report_id: fault.id,
          inventory_item_id: line.inventory_item_id,
          item_name: item[0].name,
          quantity_used: qty,
          unit: item[0].unit,
          team_name: fault.assigned_team || "Crew",
        });
        // Alert if now at or below reorder threshold
        if (newStock <= item[0].reorder_threshold) {
          toast.warning(`⚠️ Low stock: ${item[0].name} — only ${newStock} ${item[0].unit} remaining. Reorder needed!`, { duration: 6000 });
        }
      }
    }

    const materialSummary = materials
      .filter((l) => l.inventory_item_id && l.quantity)
      .map((l) => `${l.quantity} (used)`)
      .join(", ");

    const resolutionNote = `${notes}${materialUsed ? ` | Materials: ${materialUsed}` : ""}${materialSummary ? ` | Inventory: ${materialSummary}` : ""}${hoursSpent ? ` | Hours: ${hoursSpent}h` : ""}${photoUrl ? ` | Photo attached` : ""}`;

    await base44.entities.FaultReport.update(fault.id, {
      status: newStatus,
      resolution_notes: resolutionNote,
      resolved_date: newStatus === "Resolved" ? new Date().toISOString() : undefined,
    });

    await base44.entities.MaintenanceLog.create({
      fault_report_id: fault.id,
      action: `Crew update: Status → ${newStatus}`,
      status_change: `${fault.status} → ${newStatus}`,
      notes: resolutionNote,
      performed_by: fault.assigned_team || "Crew",
    });


    toast.success("Repair logged successfully!");
    onUpdated();
    onClose();
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm mx-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-heading text-base flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-accent" />
            Log Repair
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div>
            <Label className="text-xs font-medium">Update Status</Label>
            <Select value={newStatus} onValueChange={setNewStatus}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="Resolved">Resolved</SelectItem>
                <SelectItem value="Closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs font-medium">Completion Notes *</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Describe what was done..."
              rows={3}
              className="mt-1 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-medium">Materials Used (free text)</Label>
                <Input value={materialUsed} onChange={(e) => setMaterialUsed(e.target.value)} placeholder="e.g., Asphalt 50kg" className="mt-1 text-sm" />
            </div>
            <div>
              <Label className="text-xs font-medium">Hours Spent</Label>
              <Input type="number" value={hoursSpent} onChange={(e) => setHoursSpent(e.target.value)} placeholder="e.g., 2.5" className="mt-1 text-sm" />
            </div>
          </div>

          <div className="col-span-2">
            <Label className="text-xs font-medium mb-1 block">Inventory Items Used</Label>
            <MaterialSelector value={materials} onChange={setMaterials} />
          </div>
          <div>
            <Label className="text-xs font-medium">After-Repair Photo</Label>
            {photoPreview ? (
              <div className="relative mt-1 rounded-lg overflow-hidden">
                <img src={photoPreview} alt="After repair" className="w-full h-28 object-cover rounded-lg" />
                <button onClick={() => { setPhotoFile(null); setPhotoPreview(null); }} className="absolute top-1 right-1 bg-black/50 text-white text-xs px-2 py-0.5 rounded-full">Remove</button>
              </div>
            ) : (
              <label className="flex items-center justify-center gap-2 mt-1 h-16 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all text-xs text-muted-foreground">
                <Upload className="h-4 w-4" /> Upload photo
                <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhoto} />
              </label>
            )}
          </div>

          <Button onClick={handleSubmit} disabled={saving} className="w-full gap-2 h-11">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            Submit Repair Log
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
