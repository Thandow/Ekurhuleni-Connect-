import { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Mic, MicOff, Loader2, X, Volume2, VolumeX, Languages, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const categories = ["Pothole", "Burst Water Pipe", "Streetlight Failure", "Illegal Dumping", "Other"];
const areas = [
  "Benoni", "Boksburg", "Brakpan", "Daveyton", "Edenvale", "Germiston",
  "Kempton Park", "Nigel", "Springs", "Tembisa", "Thokoza", "Alberton",
  "Katlehong", "Vosloorus", "Duduza", "KwaThema", "Tsakane"
];

const SA_LANGUAGES = [
  { code: "en-ZA", label: "English", name: "English" },
  { code: "zu-ZA", label: "isiZulu", name: "Zulu" },
  { code: "xh-ZA", label: "isiXhosa", name: "Xhosa" },
  { code: "af-ZA", label: "Afrikaans", name: "Afrikaans" },
  { code: "st-ZA", label: "Sesotho", name: "Sotho" },
  { code: "tn-ZA", label: "Setswana", name: "Tswana" },
  { code: "nso-ZA", label: "Sepedi", name: "Pedi" },
  { code: "ts-ZA", label: "Xitsonga", name: "Tsonga" },
  { code: "ve-ZA", label: "Tshivenḓa", name: "Venda" },
  { code: "ss-ZA", label: "siSwati", name: "Swati" },
  { code: "nr-ZA", label: "isiNdebele", name: "Ndebele" },
];

export default function VoiceReportButton({ onFill }) {
  const [status, setStatus] = useState("idle"); // idle | listening | processing | done
  const [transcript, setTranscript] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [selectedLang, setSelectedLang] = useState(SA_LANGUAGES[0]);
  const [showLangPicker, setShowLangPicker] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const recognitionRef = useRef(null);

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("Voice input is not supported in this browser. Try Chrome.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = selectedLang.code;
    recognition.continuous = false;
    recognition.interimResults = false;
    recognitionRef.current = recognition;

    recognition.onstart = () => setStatus("listening");
    recognition.onresult = async (e) => {
      const text = e.results[0][0].transcript;
      setTranscript(text);
      setStatus("processing");
      await processVoice(text);
    };
    recognition.onerror = () => {
      toast.error("Could not capture voice. Please try again.");
      setStatus("idle");
    };
    recognition.start();
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setStatus("idle");
  };

  const processVoice = async (text) => {
    const isEnglish = selectedLang.code === "en-ZA";

    // Step 1: Translate if not English
    let englishText = text;
    let translated = "";
    if (!isEnglish) {
      const transResult = await base44.integrations.Core.InvokeLLM({
        prompt: `Translate the following ${selectedLang.name} text to English. Return only the translated text, nothing else.\n\nText: "${text}"`,
      });
      englishText = transResult;
      translated = transResult;
      setTranslatedText(translated);
    }

    // Step 2: Extract form fields from English text
    const extracted = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a fault reporting assistant for Ekurhuleni Municipality in South Africa.
Extract fault report details from this transcript and return structured data.

Transcript: "${englishText}"

Available categories: ${categories.join(", ")}
Available areas: ${areas.join(", ")}

Extract as much as possible. If a field is not mentioned, leave it as an empty string.
For location_area, match to the closest available area name or leave empty.`,
      response_json_schema: {
        type: "object",
        properties: {
          title: { type: "string" },
          description: { type: "string" },
          category: { type: "string" },
          location_address: { type: "string" },
          location_area: { type: "string" },
          reporter_name: { type: "string" },
          reporter_contact: { type: "string" },
        },
      },
    });

    onFill(extracted);
    setStatus("done");
    toast.success("Form filled from voice input!");

    // Step 3: TTS — speak back confirmation in selected language
    const confirmMsg = isEnglish
      ? `Thank you. Your fault report has been filled in. Please review and submit.`
      : null;

    if (!isEnglish) {
      const ttsText = await base44.integrations.Core.InvokeLLM({
        prompt: `Translate this English confirmation message to ${selectedLang.name}. Return only the translated text.\n\n"Thank you. Your fault report has been filled in. Please review and submit."`,
      });
      speakText(ttsText, selectedLang.code);
    } else {
      speakText(confirmMsg, "en-ZA");
    }
  };

  const speakText = (text, langCode) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = langCode;
    utterance.rate = 0.9;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
  };

  const reset = () => {
    stopSpeaking();
    setStatus("idle");
    setTranscript("");
    setTranslatedText("");
  };

  return (
    <div className="bg-card rounded-xl border border-border p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Mic className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold">Voice Assistant</p>
            <p className="text-xs text-muted-foreground">Speak in any SA language to fill the form</p>
          </div>
        </div>
      </div>

      {/* Language Picker */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setShowLangPicker(!showLangPicker)}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-border bg-muted/50 hover:bg-muted text-sm transition-colors"
        >
          <span className="flex items-center gap-2">
            <Languages className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="font-medium">{selectedLang.label}</span>
            <span className="text-xs text-muted-foreground">— Speak in {selectedLang.name}</span>
          </span>
          <ChevronDown className={cn("h-3.5 w-3.5 text-muted-foreground transition-transform", showLangPicker && "rotate-180")} />
        </button>

        {showLangPicker && (
          <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-lg overflow-hidden">
            <div className="grid grid-cols-2 p-2 gap-1">
              {SA_LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => { setSelectedLang(lang); setShowLangPicker(false); }}
                  className={cn(
                    "text-left px-3 py-2 rounded-lg text-xs transition-colors",
                    selectedLang.code === lang.code
                      ? "bg-primary text-primary-foreground font-medium"
                      : "hover:bg-muted text-foreground"
                  )}
                >
                  <span className="font-medium">{lang.label}</span>
                  <span className={cn("ml-1", selectedLang.code === lang.code ? "text-primary-foreground/70" : "text-muted-foreground")}>
                    ({lang.name})
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Action Area */}
      {status === "idle" && (
        <Button
          type="button"
          variant="outline"
          className="w-full gap-2 border-primary/30 text-primary hover:bg-primary/5"
          onClick={startListening}
        >
          <Mic className="h-4 w-4" />
          Start Recording in {selectedLang.label}
        </Button>
      )}

      {status === "listening" && (
        <div className="space-y-3">
          <div className="flex items-center justify-center gap-2 py-3">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
            </span>
            <span className="text-sm font-medium text-red-600 animate-pulse">Listening in {selectedLang.label}...</span>
          </div>
          <Button type="button" variant="outline" className="w-full gap-2 text-red-600 border-red-200" onClick={stopListening}>
            <MicOff className="h-4 w-4" /> Stop Recording
          </Button>
        </div>
      )}

      {status === "processing" && (
        <div className="space-y-2 py-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
            {selectedLang.code !== "en-ZA" ? "Translating to English..." : "Extracting fault details..."}
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full animate-pulse w-3/4" />
          </div>
        </div>
      )}

      {status === "done" && (
        <div className="space-y-2">
          {/* Transcript */}
          <div className="bg-muted/50 rounded-lg p-3 space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">You said ({selectedLang.label}):</p>
            <p className="text-xs italic">"{transcript}"</p>
            {translatedText && (
              <>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mt-2">English translation:</p>
                <p className="text-xs italic">"{translatedText}"</p>
              </>
            )}
          </div>

          {/* TTS Controls */}
          <div className="flex gap-2">
            {isSpeaking ? (
              <Button type="button" variant="outline" size="sm" className="flex-1 gap-1.5 text-xs" onClick={stopSpeaking}>
                <VolumeX className="h-3.5 w-3.5" /> Stop Playback
              </Button>
            ) : (
              <Button type="button" variant="outline" size="sm" className="flex-1 gap-1.5 text-xs text-primary border-primary/30" onClick={() => {
                const confirmText = "Thank you. Your fault report has been filled in. Please review and submit.";
                speakText(confirmText, selectedLang.code);
              }}>
                <Volume2 className="h-3.5 w-3.5" /> Replay Confirmation
              </Button>
            )}
            <Button type="button" variant="ghost" size="sm" className="gap-1 text-xs" onClick={reset}>
              <X className="h-3 w-3" /> Reset
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
