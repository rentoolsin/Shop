import { useRef, useState } from "react";
import { baseFieldClass } from "./form-field";
import { Button } from "./Button";
import { useToast } from "./Toast";
import { uploadImage } from "../../services/storage.service";

interface ImageInputProps {
  label?: string;
  value: string;
  onChange: (url: string) => void;
  /** Which storage folder an uploaded file lands in — keeps product, category, and homepage images separated in the bucket. */
  folder: "products" | "categories" | "homepage";
  hint?: string;
  error?: string;
}

const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5MB
const ACCEPTED = "image/jpeg,image/png,image/webp,image/gif";

/**
 * Image field with two ways to set the same underlying value: pick a file
 * (uploaded to Supabase Storage, see storage.service.ts) or paste a URL
 * directly. Either path ends up as a plain string in `onChange` — the form
 * around this component still only ever stores a URL on `image_url`, upload
 * is just an alternate way of producing one instead of typing it.
 */
export function ImageInput({ label, value, onChange, folder, hint, error }: ImageInputProps) {
  const [mode, setMode] = useState<"upload" | "url">("upload");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showToast("Choose an image file.", "danger");
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      showToast("Image must be under 5MB.", "danger");
      return;
    }
    setUploading(true);
    try {
      const url = await uploadImage(file, folder);
      onChange(url);
      showToast("Image uploaded.", "success");
    } catch {
      showToast("Upload failed. Try again.", "danger");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div>
      {label && (
        <span className="mb-1 block font-body text-[13px] font-medium text-graphite-600 dark:text-graphite-300">
          {label}
        </span>
      )}

      <div className="mb-2 inline-flex rounded-lg border border-graphite-200 p-0.5 dark:border-graphite-800">
        {(["upload", "url"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={[
              "rounded-md px-3 py-1 font-body text-[12.5px] font-medium transition-colors duration-150 ease-app",
              mode === m
                ? "bg-graphite-900 text-graphite-25 dark:bg-white dark:text-graphite-950"
                : "text-graphite-500 hover:text-ink dark:hover:text-ink-inverted",
            ].join(" ")}
          >
            {m === "upload" ? "Upload" : "URL"}
          </button>
        ))}
      </div>

      <div className="flex items-start gap-3">
        {value && (
          <img
            src={value}
            alt=""
            className="h-11 w-11 flex-shrink-0 rounded-lg border border-graphite-200 object-cover dark:border-graphite-800"
          />
        )}

        <div className="min-w-0 flex-1">
          {mode === "upload" ? (
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
              >
                {uploading ? "Uploading…" : value ? "Replace image" : "Choose image"}
              </Button>
              {value && (
                <Button type="button" variant="ghost" size="sm" onClick={() => onChange("")}>
                  Remove
                </Button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED}
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0])}
              />
            </div>
          ) : (
            <input
              type="url"
              inputMode="url"
              placeholder="https://…"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className={baseFieldClass(!!error)}
            />
          )}
        </div>
      </div>

      {hint && !error && (
        <span className="mt-1 block font-body text-[12px] text-graphite-400">{hint}</span>
      )}
      {error && (
        <span className="mt-1 block font-body text-[12px] text-state-danger-text dark:text-state-danger-text-dark">
          {error}
        </span>
      )}
    </div>
  );
}
