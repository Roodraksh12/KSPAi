import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/scrb/primitives";
import { Camera, Video, Mic, FlaskConical, FileText, X, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { apiRequest } from "@/api/client";
import { useI18n } from "@/lib/i18n";

interface EvidenceTypeConfig {
  id: string;
  label: string;
  labelKn: string;
  icon: any;
  accept: string;
  allowedExtensions: string[];
  allowedHint: string;
  allowedHintKn: string;
  validator: (file: File) => boolean;
}

const EVIDENCE_TYPES: EvidenceTypeConfig[] = [
  {
    id: "PHOTO",
    label: "Photo",
    labelKn: "ಭಾವಚಿತ್ರ",
    icon: Camera,
    accept: "image/*,.jpg,.jpeg,.png,.webp,.bmp,.gif,.tiff,.tif,.heic,.heif,.svg",
    allowedExtensions: ["jpg", "jpeg", "png", "webp", "bmp", "gif", "tiff", "tif", "heic", "heif", "svg"],
    allowedHint: "Strictly Photos & Images (JPG, PNG, WEBP, HEIC, GIF)",
    allowedHintKn: "ಕೇವಲ ಭಾವಚಿತ್ರ/ಫೋಟೋ ಫೈಲ್‌ಗಳು (JPG, PNG, WEBP, HEIC)",
    validator: (f: File) => {
      const ext = f.name.split(".").pop()?.toLowerCase() || "";
      const valid = ["jpg", "jpeg", "png", "webp", "bmp", "gif", "tiff", "tif", "heic", "heif", "svg"];
      return f.type.startsWith("image/") || valid.includes(ext);
    }
  },
  {
    id: "VIDEO",
    label: "Video",
    labelKn: "ವೀಡಿಯೊ",
    icon: Video,
    accept: "video/*,.mp4,.mov,.avi,.mkv,.webm,.3gp,.flv,.wmv,.m4v,.ts",
    allowedExtensions: ["mp4", "mov", "avi", "mkv", "webm", "3gp", "flv", "wmv", "m4v", "ts"],
    allowedHint: "Strictly Video Recordings (MP4, MOV, AVI, MKV, WEBM)",
    allowedHintKn: "ಕೇವಲ ವೀಡಿಯೊ ರೆಕಾರ್ಡಿಂಗ್ ಫೈಲ್‌ಗಳು (MP4, MOV, AVI, MKV)",
    validator: (f: File) => {
      const ext = f.name.split(".").pop()?.toLowerCase() || "";
      const valid = ["mp4", "mov", "avi", "mkv", "webm", "3gp", "flv", "wmv", "m4v", "ts"];
      return f.type.startsWith("video/") || valid.includes(ext);
    }
  },
  {
    id: "VOICE",
    label: "Voice",
    labelKn: "ಧ್ವನಿ ದಾಖಲೆ",
    icon: Mic,
    accept: "audio/*,.mp3,.wav,.m4a,.aac,.ogg,.flac,.wma,.amr,.opus,.weba",
    allowedExtensions: ["mp3", "wav", "m4a", "aac", "ogg", "flac", "wma", "amr", "opus", "weba"],
    allowedHint: "Strictly Voice & Audio Recordings (MP3, WAV, M4A, AAC, AMR)",
    allowedHintKn: "ಕೇವಲ ಧ್ವನಿ/ಆಡಿಯೊ ರೆಕಾರ್ಡಿಂಗ್‌ಗಳು (MP3, WAV, M4A, AAC, AMR)",
    validator: (f: File) => {
      const ext = f.name.split(".").pop()?.toLowerCase() || "";
      const valid = ["mp3", "wav", "m4a", "aac", "ogg", "flac", "wma", "amr", "opus", "weba"];
      return f.type.startsWith("audio/") || valid.includes(ext);
    }
  },
  {
    id: "FORENSIC",
    label: "Forensic",
    labelKn: "ನ್ಯಾಯವಿಜ್ಞಾನ",
    icon: FlaskConical,
    accept: ".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.json,.raw,.dd,.e01,.zip,.tar,.gz,.7z,.rar,.xml,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv,text/plain,application/json,application/zip",
    allowedExtensions: ["pdf", "doc", "docx", "xls", "xlsx", "csv", "txt", "json", "raw", "dd", "e01", "zip", "tar", "gz", "7z", "rar", "xml"],
    allowedHint: "Forensic Reports, Disk Dumps & Sheets (PDF, DOCX, XLSX, RAW, DD, ZIP)",
    allowedHintKn: "ನ್ಯಾಯವಿಜ್ಞಾನ ವರದಿಗಳು, ಡೇಟಾ ಡಂಪ್ (PDF, DOCX, RAW, ZIP)",
    validator: (f: File) => {
      const ext = f.name.split(".").pop()?.toLowerCase() || "";
      const valid = ["pdf", "doc", "docx", "xls", "xlsx", "csv", "txt", "json", "raw", "dd", "e01", "zip", "tar", "gz", "7z", "rar", "xml"];
      return valid.includes(ext) || f.type.includes("pdf") || f.type.includes("document") || f.type.includes("sheet") || f.type.includes("zip") || f.type.startsWith("text/");
    }
  },
  {
    id: "MISC",
    label: "Misc",
    labelKn: "ಇತರೆ",
    icon: FileText,
    accept: "*/*",
    allowedExtensions: [],
    allowedHint: "Miscellaneous Supporting Files & Records",
    allowedHintKn: "ಇತರೆ ದಾಖಲೆಗಳು ಮತ್ತು ಪೂರಕ ಸಾಕ್ಷ್ಯಗಳು",
    validator: () => true
  }
];

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function EvidenceForm({
  caseId,
  isOpen,
  onClose,
  onSuccess
}: {
  caseId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { lang } = useI18n();
  const [type, setType] = useState("PHOTO");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentConfig = EVIDENCE_TYPES.find((t) => t.id === type) || EVIDENCE_TYPES[0];

  const handleTypeSelect = (newTypeId: string) => {
    if (newTypeId === type) return;
    const targetConfig = EVIDENCE_TYPES.find((t) => t.id === newTypeId);
    if (!targetConfig) return;

    if (files.length > 0) {
      const validFiles = files.filter((f) => targetConfig.validator(f));
      const removedCount = files.length - validFiles.length;
      if (removedCount > 0) {
        setFiles(validFiles);
        toast.warning(
          lang === "KN"
            ? `${removedCount} ಫೈಲ್‌ಗಳು ${targetConfig.labelKn} ಮಾದರಿಗೆ ಹೊಂದಾಣಿಕೆಯಾಗದ ಕಾರಣ ತೆಗೆದುಹಾಕಲಾಗಿದೆ.`
            : `${removedCount} file(s) removed because they do not match strict ${targetConfig.label} evidence type.`
        );
      }
    }
    setType(newTypeId);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const selected = Array.from(e.target.files);

    if (files.length + selected.length > 5) {
      toast.error(
        lang === "KN"
          ? "ಒಂದೇ ಬಾರಿಗೆ ಗರಿಷ್ಠ 5 ಸಾಕ್ಷ್ಯ ಫೈಲ್‌ಗಳನ್ನು ಮಾತ್ರ ಲಗತ್ತಿಸಬಹುದು"
          : "Attach at most 5 evidence files at once"
      );
      e.target.value = "";
      return;
    }

    const oversized = selected.find((file) => file.size > 20 * 1024 * 1024);
    if (oversized) {
      toast.error(
        lang === "KN"
          ? `${oversized.name} 20 MB ಮಿತಿಯನ್ನು ಮೀರಿದೆ`
          : `${oversized.name} exceeds the 20 MB limit`
      );
      e.target.value = "";
      return;
    }

    const invalidFiles = selected.filter((f) => !currentConfig.validator(f));
    if (invalidFiles.length > 0) {
      toast.error(
        lang === "KN"
          ? `ಕಟ್ಟುನಿಟ್ಟಾದ ಸಾಕ್ಷ್ಯ ಪರೀಕ್ಷೆ: ${invalidFiles.map((f) => `"${f.name}"`).join(", ")} ಮಾನ್ಯ ${currentConfig.labelKn} ಫೈಲ್ ಅಲ್ಲ. ${currentConfig.allowedHintKn} ಮಾತ್ರ ಅನುಮತಿಸಲಾಗಿದೆ.`
          : `Strict evidence check: ${invalidFiles.map((f) => `"${f.name}"`).join(", ")} is not a valid ${currentConfig.label} file. ${currentConfig.allowedHint} only.`
      );
      e.target.value = "";
      return;
    }

    setFiles((prev) => [...prev, ...selected]);
    e.target.value = "";
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!description.trim()) {
      toast.error(lang === "KN" ? "ವಿವರಣೆ ಅಗತ್ಯವಾಗಿದೆ" : "Description is required");
      return;
    }

    setBusy(true);
    try {
      const formData = new FormData();
      formData.append("type", type);
      formData.append("description", description);
      files.forEach((f) => formData.append("files", f));

      await apiRequest(`/api/cases/${caseId}/evidence`, {
        method: "POST",
        body: formData,
      });

      toast.success(lang === "KN" ? "ಸಾಕ್ಷ್ಯವನ್ನು ಯಶಸ್ವಿಯಾಗಿ ಸೇರಿಸಲಾಗಿದೆ" : "Evidence added successfully");
      setDescription("");
      setFiles([]);
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || (lang === "KN" ? "ಸಾಕ್ಷ್ಯ ಸೇರಿಸಲು ವಿಫಲವಾಗಿದೆ" : "Failed to add evidence"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[620px] bg-background border-hairline p-0 gap-0 overflow-hidden rounded-3xl shadow-2xl">
        <div className="p-6 border-b border-hairline flex items-center justify-between bg-surface-2/30">
          <div>
            <DialogTitle className="text-xl font-bold">
              {lang === "KN" ? "ಸಾಕ್ಷ್ಯ ಸೇರಿಸಿ" : "Add Evidence"}
            </DialogTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              {lang === "KN"
                ? "ಆಯ್ದ ಸಾಕ್ಷ್ಯ ಪ್ರಕಾರಕ್ಕೆ ಕಟ್ಟುನಿಟ್ಟಾಗಿ ಹೊಂದಾಣಿಕೆಯಾಗುವ ಫೈಲ್‌ಗಳನ್ನು ಮಾತ್ರ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ"
                : "Strictly upload files matching the selected evidence category"}
            </p>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Type Selector Tabs */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
              {lang === "KN" ? "ಸಾಕ್ಷ್ಯ ಪ್ರಕಾರ (Strict Evidence Type)" : "Evidence Type (Strict Filtering)"}
            </label>
            <div className="grid grid-cols-5 gap-1.5 p-1.5 bg-surface-2 rounded-2xl border border-hairline">
              {EVIDENCE_TYPES.map((t) => {
                const isActive = type === t.id;
                const Icon = t.icon;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => handleTypeSelect(t.id)}
                    className={`flex flex-col items-center justify-center gap-1.5 py-2.5 px-1 rounded-xl transition-all ${
                      isActive
                        ? "bg-surface text-teal font-semibold shadow-xs border border-teal/20 scale-[1.02]"
                        : "text-muted-foreground hover:text-foreground hover:bg-surface-3/50"
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? "text-teal" : "text-muted-foreground"}`} />
                    <span className="text-xs">{lang === "KN" ? t.labelKn : t.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Allowed types description badge */}
            <div className="mt-2.5 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-teal/5 border border-teal/20 text-xs text-teal">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span className="font-medium">
                {lang === "KN" ? currentConfig.allowedHintKn : currentConfig.allowedHint}
              </span>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
              {lang === "KN" ? "ವಿವರಣೆ (Description)" : "Description"}
            </label>
            <textarea
              className="w-full bg-surface-2 border border-hairline rounded-xl px-3.5 py-2.5 text-sm min-h-[90px] focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal transition-all placeholder:text-muted-foreground"
              placeholder={
                lang === "KN"
                  ? "ಸಾಕ್ಷ್ಯದ ವಿವರಗಳು, ಸ್ಥಳ, ಸಮಯ ಮತ್ತು ವಶಪಡಿಸಿಕೊಂಡ ಸಂದರ್ಭವನ್ನು ವಿವರಿಸಿ..."
                  : "Describe the evidence, source, seizure memo or context in detail..."
              }
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Strict File Upload */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {lang === "KN" ? "ಸಾಕ್ಷ್ಯ ಫೈಲ್‌ಗಳು (Strict Files)" : "Evidence Files"}
              </label>
              <span className="text-[11px] text-muted-foreground">
                Max 5 files &bull; 20 MB each
              </span>
            </div>

            {/* Hidden Input with STRICT accept attribute keyed by type */}
            <input
              key={type}
              type="file"
              multiple
              accept={currentConfig.accept}
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileChange}
            />

            <div className="flex items-center gap-3">
              <Button
                variant="secondary"
                onClick={() => fileInputRef.current?.click()}
                type="button"
                className="gap-2 border border-hairline hover:border-teal/50 hover:bg-surface-3 transition-all"
              >
                <currentConfig.icon className="w-4 h-4 text-teal" />
                <span>
                  {lang === "KN"
                    ? `${currentConfig.labelKn} ಫೈಲ್ ಆಯ್ಕೆಮಾಡಿ`
                    : `Select ${currentConfig.label} Files`}
                </span>
              </Button>
              <span className="text-xs text-muted-foreground">
                {files.length > 0
                  ? `${files.length} / 5 ${lang === "KN" ? "ಫೈಲ್ ಆಯ್ಕೆಯಾಗಿದೆ" : "file(s) selected"}`
                  : lang === "KN"
                  ? "ಯಾವುದೇ ಫೈಲ್ ಆಯ್ಕೆಯಾಗಿಲ್ಲ"
                  : "No files selected"}
              </span>
            </div>

            {/* Selected Files Preview List with Type Icon and Remove Button */}
            {files.length > 0 && (
              <div className="mt-3 divide-y divide-hairline bg-surface-2 border border-hairline rounded-2xl max-h-[140px] overflow-y-auto custom-scrollbar">
                {files.map((f, i) => (
                  <div key={i} className="flex items-center justify-between px-3 py-2 text-xs">
                    <div className="flex items-center gap-2.5 min-w-0 mr-2">
                      <currentConfig.icon className="w-4 h-4 text-teal shrink-0" />
                      <span className="truncate font-medium text-foreground">{f.name}</span>
                      <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded bg-surface border border-hairline text-muted-foreground">
                        {formatFileSize(f.size)}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(i)}
                      className="p-1 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-colors shrink-0"
                      title="Remove file"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="p-6 border-t border-hairline flex justify-end gap-3 bg-surface-2/40">
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            {lang === "KN" ? "ರದ್ದುಮಾಡಿ" : "Cancel"}
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={busy} className="bg-teal hover:bg-teal/90 text-white font-medium">
            {busy ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            {lang === "KN" ? "ಸಾಕ್ಷ್ಯ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ" : "Upload Evidence"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
