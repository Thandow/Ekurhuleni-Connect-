import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, MapPin, Send, Loader2, Sparkles, Camera, CheckCircle2 } from "lucide-react";
import VoiceReportButton from "../components/VoiceReportButton";
import { toast } from "sonner";

const categories = ["Pothole", "Burst Water Pipe", "Streetlight Failure", "Illegal Dumping", "Other"];
const areas = [
  "Benoni", "Boksburg", "Brakpan", "Daveyton", "Edenvale", "Germiston",
  "Kempton Park", "Nigel", "Springs", "Tembisa", "Thokoza", "Alberton",
  "Katlehong", "Vosloorus", "Duduza", "KwaThema", "Tsakane"
];

export default function ReportFault() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: "", description: "", category: "", location_address: "",
    location_area: "", reporter_name: "", reporter_contact: "",
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiResult, setAiResult] = useState(null);

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setAiResult(null);
    }
  };

  const analyzeWithAI = async () => {
    if (!imageFile && !formData.description) {
      toast.error("Please upload an image or provide a description first");
      return;
    }
    setIsAnalyzing(true);
    let fileUrl = null;
    if (imageFile) {
      const uploaded = await base44.integrations.Core.UploadFile({ file: imageFile });
      fileUrl = uploaded.file_url;
    }

    const prompt = `You are an AI fault classification system for Ekurhuleni Municipality infrastructure.
Analyze the following fault report and classify it.

Description: ${formData.description || "No description provided"}
Location: ${formData.location_address || "Not specified"}, ${formData.location_area || "Not specified"}

Classify the fault into one of these categories:
- Pothole
- Burst Water Pipe
- Streetlight Failure
- Illegal Dumping
- Other

Also assess the severity (Low, Medium, High, Critical) and provide a priority score (1-10).
Provide a brief analysis summary.`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      file_urls: fileUrl ? [fileUrl] : undefined,
      response_json_schema: {
        type: "object",
        properties: {
          category: { type: "string", enum: categories },
          severity: { type: "string", enum: ["Low", "Medium", "High", "Critical"] },
          priority_score: { type: "number" },
          confidence: { type: "number" },
          analysis: { type: "string" },
          suggested_title: { type: "string" },
        },
      },
    });

    setAiResult({ ...result, image_url: fileUrl });
    setFormData((prev) => ({
      ...prev,
      category: result.category || prev.category,
      title: result.suggested_title || prev.title,
    }));
    setIsAnalyzing(false);
    toast.success("AI analysis complete!");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.description || !formData.category || !formData.location_address || !formData.location_area) {
      toast.error("Please fill in all required fields");
      return;
    }
    setIsSubmitting(true);

    let imageUrl = aiResult?.image_url;
    if (imageFile && !imageUrl) {
      const uploaded = await base44.integrations.Core.UploadFile({ file: imageFile });
      imageUrl = uploaded.file_url;
    }

    const newReport = await base44.entities.FaultReport.create({
      ...formData,
      image_url: imageUrl || "",
      status: "Pending",
      severity: aiResult?.severity || "Medium",
      ai_confidence: aiResult?.confidence || 0,
      ai_analysis: aiResult?.analysis || "",
      priority_score: aiResult?.priority_score || 5,
    });

    toast.success("Fault report submitted successfully!");
    navigate("/faults");
    setIsSubmitting(false);
  };

  const update = (field, value) => setFormData((p) => ({ ...p, [field]: value }));

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="font-heading text-2xl font-bold text-foreground">Report a Fault</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Help us keep Ekurhuleni safe. Report infrastructure issues and our AI will classify them automatically.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <VoiceReportButton onFill={(data) => setFormData((prev) => ({ ...prev, ...Object.fromEntries(Object.entries(data).filter(([, v]) => v)) }))} />
        {/* Image Upload */}
        <div className="bg-card rounded-xl border border-border p-6">
          <Label className="text-sm font-semibold mb-3 block">
            <Camera className="h-4 w-4 inline mr-2" />
            Upload Photo
          </Label>
          <div className="relative">
            {imagePreview ? (
              <div className="relative rounded-lg overflow-hidden">
                <img src={imagePreview} alt="Preview" className="w-full h-48 object-cover rounded-lg" />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => { setImageFile(null); setImagePreview(null); setAiResult(null); }}
                >
                  Remove
                </Button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all">
                <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                <span className="text-sm text-muted-foreground">Click to upload a photo of the fault</span>
                <span className="text-xs text-muted-foreground mt-1">JPG, PNG up to 10MB</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
              </label>
            )}
          </div>

          {/* AI Analyze Button */}
          <Button
            type="button"
            variant="outline"
            className="w-full mt-4 gap-2 border-primary/30 text-primary hover:bg-primary/5"
            onClick={analyzeWithAI}
            disabled={isAnalyzing}
          >
            {isAnalyzing ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Analyzing with AI...</>
            ) : (
              <><Sparkles className="h-4 w-4" /> Analyze with AI</>
            )}
          </Button>

          {aiResult && (
            <div className="mt-4 bg-primary/5 border border-primary/20 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="h-4 w-4 text-accent" />
                <span className="text-sm font-semibold text-foreground">AI Classification Result</span>
                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full ml-auto">
                  {aiResult.confidence}% confidence
                </span>
              </div>
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-muted-foreground">Category</span>
                  <p className="font-medium">{aiResult.category}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Severity</span>
                  <p className="font-medium">{aiResult.severity}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Priority</span>
                  <p className="font-medium">{aiResult.priority_score}/10</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">{aiResult.analysis}</p>
            </div>
          )}
        </div>

        {/* Fault Details */}
        <div className="bg-card rounded-xl border border-border p-6 space-y-4">
          <h2 className="font-heading font-semibold text-sm">Fault Details</h2>

          <div>
            <Label htmlFor="title" className="text-xs">Title *</Label>
            <Input id="title" value={formData.title} onChange={(e) => update("title", e.target.value)} placeholder="e.g., Large pothole on Main Road" className="mt-1" />
          </div>

          <div>
            <Label htmlFor="description" className="text-xs">Description *</Label>
            <Textarea id="description" value={formData.description} onChange={(e) => update("description", e.target.value)} placeholder="Describe the fault in detail..." rows={4} className="mt-1" />
          </div>

          <div>
            <Label className="text-xs">Category *</Label>
            <Select value={formData.category} onValueChange={(v) => update("category", v)}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Select category" /></SelectTrigger>
              <SelectContent>
                {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Location */}
        <div className="bg-card rounded-xl border border-border p-6 space-y-4">
          <h2 className="font-heading font-semibold text-sm flex items-center gap-2">
            <MapPin className="h-4 w-4" /> Location
          </h2>

          <div>
            <Label htmlFor="address" className="text-xs">Street Address *</Label>
            <Input id="address" value={formData.location_address} onChange={(e) => update("location_address", e.target.value)} placeholder="e.g., 123 Commissioner Street" className="mt-1" />
          </div>

          <div>
            <Label className="text-xs">Area / Suburb *</Label>
            <Select value={formData.location_area} onValueChange={(v) => update("location_area", v)}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Select area" /></SelectTrigger>
              <SelectContent>
                {areas.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Reporter Info */}
        <div className="bg-card rounded-xl border border-border p-6 space-y-4">
          <h2 className="font-heading font-semibold text-sm">Your Information (Optional)</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name" className="text-xs">Name</Label>
              <Input id="name" value={formData.reporter_name} onChange={(e) => update("reporter_name", e.target.value)} placeholder="Your name" className="mt-1" />
            </div>
            <div>
              <Label htmlFor="contact" className="text-xs">Contact</Label>
              <Input id="contact" value={formData.reporter_contact} onChange={(e) => update("reporter_contact", e.target.value)} placeholder="Phone or email" className="mt-1" />
            </div>
          </div>
        </div>

        <Button type="submit" className="w-full gap-2 h-12" disabled={isSubmitting}>
          {isSubmitting ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Submitting...</>
          ) : (
            <><Send className="h-4 w-4" /> Submit Fault Report</>
          )}
        </Button>
      </form>
    </div>
  );
}
