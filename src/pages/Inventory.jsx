import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import {
  Package, Plus, AlertTriangle, Loader2, Pencil, Trash2,
  Search, TrendingDown, CheckCircle2, RefreshCw
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const CATEGORIES = ["Road Materials", "Plumbing", "Electrical", "Safety", "Tools", "Other"];

const EMPTY_FORM = {
  name: "", category: "Road Materials", unit: "", quantity_in_stock: "",
  reorder_threshold: "", reorder_quantity: "", supplier: "", unit_cost: "", location: "", notes: ""
};

export default function Inventory() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const data = await base44.entities.InventoryItem.list("name", 200);
    setItems(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => { setEditItem(null); setForm(EMPTY_FORM); setShowModal(true); };
  const openEdit = (item) => {
    setEditItem(item);
    setForm({ ...EMPTY_FORM, ...item });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.unit || form.quantity_in_stock === "" || form.reorder_threshold === "") {
      toast.error("Please fill in required fields"); return;
    }
    setSaving(true);
    const payload = {
      ...form,
      quantity_in_stock: Number(form.quantity_in_stock),
      reorder_threshold: Number(form.reorder_threshold),
      reorder_quantity: form.reorder_quantity ? Number(form.reorder_quantity) : undefined,
      unit_cost: form.unit_cost ? Number(form.unit_cost) : undefined,
    };
    if (editItem) {
      await base44.entities.InventoryItem.update(editItem.id, payload);
      toast.success("Item updated");
    } else {
      await base44.entities.InventoryItem.create(payload);
      toast.success("Item added");
    }
    setSaving(false);
    setShowModal(false);
    load();
  };

  const handleDelete = async (id) => {
    await base44.entities.InventoryItem.delete(id);
    toast.success("Item deleted");
    load();
  };

  const filtered = items.filter((i) => {
    const matchSearch = !search || i.name?.toLowerCase().includes(search.toLowerCase()) || i.supplier?.toLowerCase().includes(search.toLowerCase());
    const matchCat = categoryFilter === "All" || i.category === categoryFilter;
    return matchSearch && matchCat;
  });

  const lowStock = items.filter((i) => i.quantity_in_stock <= i.reorder_threshold);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold">Inventory</h1>
          <p className="text-sm text-muted-foreground mt-1">{items.length} items · {lowStock.length} low stock</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load} className="gap-1.5">
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </Button>
          <Button onClick={openAdd} className="gap-2">
            <Plus className="h-4 w-4" /> Add Item
          </Button>
        </div>
      </div>

      {/* Low Stock Alerts */}
      {lowStock.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <h2 className="font-semibold text-sm text-amber-800">Reorder Alerts ({lowStock.length})</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {lowStock.map((item) => (
              <div key={item.id} className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-amber-200">
                <div>
                  <p className="text-xs font-medium text-foreground">{item.name}</p>
                  <p className="text-xs text-amber-700">
                    {item.quantity_in_stock} {item.unit} remaining
                    {item.reorder_quantity ? ` · Reorder: ${item.reorder_quantity} ${item.unit}` : ""}
                  </p>
                </div>
                <TrendingDown className="h-4 w-4 text-amber-500 flex-shrink-0" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search items..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Categories</SelectItem>
            {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Inventory Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="p-3 text-left font-medium text-muted-foreground">Item</th>
                <th className="p-3 text-left font-medium text-muted-foreground hidden sm:table-cell">Category</th>
                <th className="p-3 text-left font-medium text-muted-foreground">Stock</th>
                <th className="p-3 text-left font-medium text-muted-foreground hidden md:table-cell">Reorder At</th>
                <th className="p-3 text-left font-medium text-muted-foreground hidden lg:table-cell">Supplier</th>
                <th className="p-3 text-left font-medium text-muted-foreground hidden lg:table-cell">Cost/Unit</th>
                <th className="p-3 text-left font-medium text-muted-foreground">Status</th>
                <th className="p-3 text-left font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => {
                const isLow = item.quantity_in_stock <= item.reorder_threshold;
                const isEmpty = item.quantity_in_stock <= 0;
                return (
                  <tr key={item.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                    <td className="p-3">
                      <p className="font-medium text-foreground">{item.name}</p>
                      {item.location && <p className="text-muted-foreground text-xs">{item.location}</p>}
                    </td>
                    <td className="p-3 hidden sm:table-cell text-muted-foreground">{item.category}</td>
                    <td className="p-3">
                      <span className={cn("font-semibold", isEmpty ? "text-red-600" : isLow ? "text-amber-600" : "text-foreground")}>
                        {item.quantity_in_stock} {item.unit}
                      </span>
                    </td>
                    <td className="p-3 hidden md:table-cell text-muted-foreground">{item.reorder_threshold} {item.unit}</td>
                    <td className="p-3 hidden lg:table-cell text-muted-foreground">{item.supplier || "—"}</td>
                    <td className="p-3 hidden lg:table-cell text-muted-foreground">{item.unit_cost ? `R${item.unit_cost}` : "—"}</td>
                    <td className="p-3">
                      {isEmpty ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 border border-red-200">
                          <AlertTriangle className="h-3 w-3" /> Out of Stock
                        </span>
                      ) : isLow ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 border border-amber-200">
                          <TrendingDown className="h-3 w-3" /> Low Stock
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-200">
                          <CheckCircle2 className="h-3 w-3" /> In Stock
                        </span>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(item)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleDelete(item.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="p-12 text-center text-muted-foreground text-sm">No inventory items found.</div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              {editItem ? "Edit Item" : "Add Inventory Item"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label className="text-xs">Item Name *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g., Asphalt Mix" className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Unit *</Label>
                <Input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} placeholder="kg / litres / units" className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">Current Stock *</Label>
                <Input type="number" value={form.quantity_in_stock} onChange={(e) => setForm({ ...form, quantity_in_stock: e.target.value })} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">Reorder Threshold *</Label>
                <Input type="number" value={form.reorder_threshold} onChange={(e) => setForm({ ...form, reorder_threshold: e.target.value })} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">Reorder Quantity</Label>
                <Input type="number" value={form.reorder_quantity} onChange={(e) => setForm({ ...form, reorder_quantity: e.target.value })} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">Cost per Unit (ZAR)</Label>
                <Input type="number" value={form.unit_cost} onChange={(e) => setForm({ ...form, unit_cost: e.target.value })} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">Supplier</Label>
                <Input value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} placeholder="Supplier name" className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">Storage Location</Label>
                <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="e.g., Depot A" className="mt-1" />
              </div>
            </div>
            <Button onClick={handleSave} disabled={saving} className="w-full gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              {editItem ? "Save Changes" : "Add Item"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
