import { useRef, useState } from "react";
import { Button } from "./Button";
import { useToast } from "./Toast";
import { uploadImage } from "../../services/storage.service";

export interface GalleryImage {
  id: string | null; // null = new, not yet saved
  imageUrl: string;
  sortOrder: number;
}

interface ImageGalleryInputProps {
  label?: string;
  images: GalleryImage[];
  onChange: (images: GalleryImage[]) => void;
  onRemoveExisting?: (id: string) => void;
  folder: "products" | "categories" | "homepage";
  hint?: string;
}

const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5MB
const ACCEPTED = "image/jpeg,image/png,image/webp,image/gif";

/**
 * Manages the extra gallery photos shown in the detail-page carousel
 * (product_images — separate from the single cover `image_url` field
 * handled by ImageInput). Multiple files can be picked at once; each
 * upload goes to the same `product-images` bucket as the cover photo.
 *
 * Removing an *existing* (already-saved) photo calls onRemoveExisting
 * immediately rather than only dropping it from local state — mirrors how
 * ProductForm handles variant removal (explicit delete call queued
 * alongside the rest of the save, not diffed after the fact).
 */
export function ImageGalleryInput({
  label,
  images,
  onChange,
  onRemoveExisting,
  folder,
  hint,
}: ImageGalleryInputProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  const handleFiles = async (fileList: FileList | null) => {
    const files = Array.from(fileList ?? []);
    if (files.length === 0) return;

    const valid: File[] = [];
    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        showToast(`Skipped ${file.name} — not an image.`, "danger");
        continue;
      }
      if (file.size > MAX_FILE_BYTES) {
        showToast(`Skipped ${file.name} — over 5MB.`, "danger");
        continue;
      }
      valid.push(file);
    }
    if (valid.length === 0) return;

    setUploading(true);
    try {
      const uploaded = await Promise.all(valid.map((file) => uploadImage(file, folder)));
      const next: GalleryImage[] = [
        ...images,
        ...uploaded.map((url, i) => ({
          id: null,
          imageUrl: url,
          sortOrder: images.length + i,
        })),
      ];
      onChange(next);
      showToast(
        uploaded.length === 1 ? "Photo added." : `${uploaded.length} photos added.`,
        "success",
      );
    } catch {
      showToast("Upload failed. Try again.", "danger");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeAt = (index: number) => {
    const target = images[index];
    if (target.id) onRemoveExisting?.(target.id);
    onChange(images.filter((_, i) => i !== index).map((img, i) => ({ ...img, sortOrder: i })));
  };

  return (
    <div>
      {label && (
        <span className="mb-1 block font-body text-[13px] font-medium text-graphite-600 dark:text-graphite-300">
          {label}
        </span>
      )}

      {images.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {images.map((img, index) => (
            <div key={img.id ?? `new-${index}`} className="group relative">
              <img
                src={img.imageUrl}
                alt=""
                className="h-16 w-16 flex-shrink-0 rounded-lg border border-graphite-200 object-cover dark:border-graphite-800"
              />
              <button
                type="button"
                onClick={() => removeAt(index)}
                aria-label="Remove photo"
                className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-graphite-900 text-graphite-25 shadow-card dark:bg-white dark:text-graphite-950"
              >
                <svg viewBox="0 0 24 24" fill="none" strokeWidth={2} className="h-3 w-3">
                  <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      <Button
        type="button"
        variant="secondary"
        size="sm"
        disabled={uploading}
        onClick={() => fileInputRef.current?.click()}
      >
        {uploading ? "Uploading…" : "Add photos"}
      </Button>
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED}
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {hint && <span className="mt-1 block font-body text-[12px] text-graphite-400">{hint}</span>}
    </div>
  );
}
