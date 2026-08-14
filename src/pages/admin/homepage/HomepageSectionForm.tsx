import { useEffect, useState, type FormEvent } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import {
  useAdminHomepageSection,
  useAdminHomepageRevisions,
} from "../../../hooks/useAdminData";
import {
  saveHomepageSectionContent,
  setHomepageSectionPublished,
} from "../../../services/admin-homepage-content.service";
import {
  HOMEPAGE_SECTION_LABEL,
  isHomepageSectionKey,
  emptyHeroSlide,
  withHeroDefaults,
  type HeroContent,
  type HeroSlide,
  type WhyRentoolsContent,
  type HowItWorksContent,
  type ContactLocationContent,
  type HomepageSectionKey,
} from "../../../utils/homepage-content";
import { Input } from "../../../components/ui/Input";
import { Textarea } from "../../../components/ui/Textarea";
import { Switch } from "../../../components/ui/Switch";
import { Button } from "../../../components/ui/Button";
import { ImageInput } from "../../../components/ui/ImageInput";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { LoadingState } from "../../../components/ui/LoadingState";
import { ErrorState } from "../../../components/ui/ErrorState";
import { ConfirmDialog } from "../../../components/ui/ConfirmDialog";
import { useToast } from "../../../components/ui/Toast";

/** Admin editor for the hero carousel slides — add/remove/reorder images, each with alt text, an optional on-slide caption, and an optional in-app link. */
function HeroSlidesEditor({
  slides,
  onChange,
}: {
  slides: HeroSlide[];
  onChange: (v: HeroSlide[]) => void;
}) {
  const updateSlide = (index: number, patch: Partial<HeroSlide>) => {
    onChange(slides.map((slide, i) => (i === index ? { ...slide, ...patch } : slide)));
  };
  const removeSlide = (index: number) => {
    onChange(slides.filter((_, i) => i !== index));
  };
  const moveSlide = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= slides.length) return;
    const next = [...slides];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  return (
    <div className="space-y-3">
      <div>
        <span className="block font-body text-[13px] font-medium text-graphite-600 dark:text-graphite-300">
          Carousel slides
        </span>
        <span className="mt-0.5 block font-body text-[12px] text-graphite-400">
          Shown as a swipeable image carousel at the top of the homepage. Leave empty to show
          plain heading/subheading text only, no carousel.
        </span>
      </div>

      {slides.map((slide, i) => (
        <div key={slide.id} className="space-y-3 rounded border border-graphite-200 p-3 dark:border-graphite-800">
          <div className="flex items-center justify-between">
            <span className="font-body text-[12.5px] font-medium text-graphite-500">
              Slide {i + 1}
            </span>
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={i === 0}
                onClick={() => moveSlide(i, -1)}
                aria-label="Move slide up"
              >
                ↑
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={i === slides.length - 1}
                onClick={() => moveSlide(i, 1)}
                aria-label="Move slide down"
              >
                ↓
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => removeSlide(i)}
              >
                Remove
              </Button>
            </div>
          </div>

          <ImageInput
            label="Image"
            value={slide.imageUrl}
            onChange={(url) => updateSlide(i, { imageUrl: url })}
            folder="homepage"
            hint="Landscape images work best (roughly 16:10)."
          />
          <Input
            label="Alt text"
            value={slide.alt}
            onChange={(e) => updateSlide(i, { alt: e.target.value })}
            hint="Describes the image for screen readers — required for accessibility."
          />
          <Input
            label="Caption (optional)"
            value={slide.caption ?? ""}
            onChange={(e) => updateSlide(i, { caption: e.target.value })}
            hint="Short text overlaid on the image, e.g. a promo line."
          />
          <Input
            label="Link to (optional)"
            value={slide.linkTo ?? ""}
            onChange={(e) => updateSlide(i, { linkTo: e.target.value })}
            hint="In-app path the slide opens when tapped, e.g. /products."
          />
        </div>
      ))}

      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={() => onChange([...slides, emptyHeroSlide()])}
      >
        Add slide
      </Button>
    </div>
  );
}

function HeroFields({
  value,
  onChange,
}: {
  value: HeroContent;
  onChange: (v: HeroContent) => void;
}) {
  const slides = value.slides ?? [];
  return (
    <>
      <Input
        label="Heading"
        value={value.heading}
        onChange={(e) => onChange({ ...value, heading: e.target.value })}
      />
      <Textarea
        label="Subheading"
        value={value.subheading}
        onChange={(e) => onChange({ ...value, subheading: e.target.value })}
      />
      <HeroSlidesEditor
        slides={slides}
        onChange={(next) => onChange({ ...value, slides: next })}
      />
    </>
  );
}

function WhyRentoolsFields({
  value,
  onChange,
}: {
  value: WhyRentoolsContent;
  onChange: (v: WhyRentoolsContent) => void;
}) {
  const updatePoint = (index: number, text: string) => {
    const next = [...value.points];
    next[index] = text;
    onChange({ points: next });
  };
  const removePoint = (index: number) => {
    onChange({ points: value.points.filter((_, i) => i !== index) });
  };
  return (
    <div className="space-y-2">
      <span className="block font-body text-[13px] font-medium text-graphite-600 dark:text-graphite-300">
        Points
      </span>
      {value.points.map((point, i) => (
        <div key={i} className="flex gap-2">
          <Input value={point} onChange={(e) => updatePoint(i, e.target.value)} className="flex-1" />
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => removePoint(i)}
            aria-label={`Remove point ${i + 1}`}
          >
            Remove
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={() => onChange({ points: [...value.points, ""] })}
      >
        Add point
      </Button>
    </div>
  );
}

function HowItWorksFields({
  value,
  onChange,
}: {
  value: HowItWorksContent;
  onChange: (v: HowItWorksContent) => void;
}) {
  const updateStep = (index: number, field: "title" | "body", text: string) => {
    const next = value.steps.map((step, i) => (i === index ? { ...step, [field]: text } : step));
    onChange({ steps: next });
  };
  const removeStep = (index: number) => {
    onChange({ steps: value.steps.filter((_, i) => i !== index) });
  };
  return (
    <div className="space-y-4">
      <span className="block font-body text-[13px] font-medium text-graphite-600 dark:text-graphite-300">
        Steps
      </span>
      {value.steps.map((step, i) => (
        <div key={i} className="space-y-2 rounded border border-graphite-200 p-3 dark:border-graphite-800">
          <Input
            label={`Step ${i + 1} title`}
            value={step.title}
            onChange={(e) => updateStep(i, "title", e.target.value)}
          />
          <Textarea
            label="Description"
            value={step.body}
            onChange={(e) => updateStep(i, "body", e.target.value)}
          />
          <Button type="button" variant="secondary" size="sm" onClick={() => removeStep(i)}>
            Remove step
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={() => onChange({ steps: [...value.steps, { title: "", body: "" }] })}
      >
        Add step
      </Button>
    </div>
  );
}

function ContactLocationFields({
  value,
  onChange,
}: {
  value: ContactLocationContent;
  onChange: (v: ContactLocationContent) => void;
}) {
  return (
    <Textarea
      label="Address"
      value={value.address}
      onChange={(e) => onChange({ address: e.target.value })}
    />
  );
}

export function HomepageSectionForm() {
  const { sectionKey: rawKey } = useParams<{ sectionKey: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const validKey = rawKey && isHomepageSectionKey(rawKey) ? rawKey : null;
  // Hooks must run unconditionally — fall back to a placeholder key when the
  // route param is invalid, and just redirect below without using the data.
  const sectionKey: HomepageSectionKey = validKey ?? "hero";

  const section = useAdminHomepageSection(sectionKey);
  const revisions = useAdminHomepageRevisions(sectionKey);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [content, setContent] = useState<any>(null);
  const [isEnabled, setIsEnabled] = useState(true);
  const [sortOrder, setSortOrder] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [restoreTarget, setRestoreTarget] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    if (section.status === "success" && section.data) {
      // Rows saved before the hero carousel existed have no `slides` key —
      // default it to an empty array so the editor and public page both
      // treat "missing" the same as "no slides yet" rather than crashing.
      const nextContent =
        sectionKey === "hero"
          ? withHeroDefaults(section.data.content as unknown as Record<string, unknown>)
          : section.data.content;
      setContent(nextContent);
      setIsEnabled(section.data.isEnabled);
      setSortOrder(section.data.sortOrder);
    }
  }, [section.status, section.data, sectionKey]);

  if (!validKey) {
    return <Navigate to="/admin/homepage" replace />;
  }

  if (section.status === "loading" || content === null) {
    return <LoadingState label="Loading section…" />;
  }
  if (section.status === "error" || !section.data) {
    return <ErrorState title="Couldn't load this section" onRetry={section.refetch} />;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      await saveHomepageSectionContent(sectionKey, { content, isEnabled, sortOrder });
      showToast("Saved as draft.", "success");
      section.refetch();
      revisions.refetch();
    } catch {
      showToast("Couldn't save this section. Try again.", "danger");
    } finally {
      setSubmitting(false);
    }
  };

  const handleTogglePublish = async () => {
    if (publishing) return;
    setPublishing(true);
    try {
      await setHomepageSectionPublished(sectionKey, !section.data!.isPublished);
      showToast(section.data!.isPublished ? "Unpublished." : "Published.", "success");
      section.refetch();
    } catch {
      showToast("Couldn't update publish status. Try again.", "danger");
    } finally {
      setPublishing(false);
    }
  };

  const handleRestore = async () => {
    if (!restoreTarget || restoring) return;
    const revision = revisions.status === "success" ? revisions.data.find((r) => r.id === restoreTarget) : null;
    if (!revision) {
      setRestoreTarget(null);
      return;
    }
    setRestoring(true);
    try {
      const restoredContent =
        sectionKey === "hero" ? withHeroDefaults(revision.content) : revision.content;
      setContent(restoredContent);
      await saveHomepageSectionContent(sectionKey, {
        content: restoredContent as never,
        isEnabled,
        sortOrder,
      });
      showToast("Restored as draft. Publish to make it live.", "success");
      section.refetch();
      revisions.refetch();
    } catch {
      showToast("Couldn't restore this revision. Try again.", "danger");
    } finally {
      setRestoring(false);
      setRestoreTarget(null);
    }
  };

  return (
    <div className="max-w-md">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h1 className="font-display text-[20px] font-bold text-ink dark:text-ink-inverted">
          {HOMEPAGE_SECTION_LABEL[sectionKey]}
        </h1>
        {section.data.isPublished ? (
          <StatusBadge label="Published" tone="success" />
        ) : (
          <StatusBadge label="Draft" tone="warning" />
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {sectionKey === "hero" && (
          <HeroFields value={content as HeroContent} onChange={setContent} />
        )}
        {sectionKey === "why_rentools" && (
          <WhyRentoolsFields value={content as WhyRentoolsContent} onChange={setContent} />
        )}
        {sectionKey === "how_it_works" && (
          <HowItWorksFields value={content as HowItWorksContent} onChange={setContent} />
        )}
        {sectionKey === "contact_location" && (
          <ContactLocationFields value={content as ContactLocationContent} onChange={setContent} />
        )}

        <Switch
          label="Visible on homepage"
          checked={isEnabled}
          onChange={setIsEnabled}
        />
        <Input
          label="Sort order"
          type="number"
          value={sortOrder}
          onChange={(e) => setSortOrder(Number(e.target.value))}
          hint="Lower numbers appear first."
        />

        <div className="flex gap-2 pt-2">
          <Button
            variant="secondary"
            fullWidth
            type="button"
            onClick={() => navigate("/admin/homepage")}
          >
            Back
          </Button>
          <Button fullWidth type="submit" disabled={submitting}>
            {submitting ? "Saving…" : "Save draft"}
          </Button>
        </div>
        <Button
          variant={section.data.isPublished ? "danger" : "primary"}
          fullWidth
          type="button"
          disabled={publishing}
          onClick={handleTogglePublish}
        >
          {publishing
            ? "Working…"
            : section.data.isPublished
              ? "Unpublish"
              : "Publish"}
        </Button>
      </form>

      <h2 className="mb-2 mt-8 font-display text-[15px] font-semibold text-ink dark:text-ink-inverted">
        Revision history
      </h2>
      {revisions.status === "loading" && (
        <p className="font-body text-[13px] text-graphite-500">Loading…</p>
      )}
      {revisions.status === "error" && (
        <ErrorState description="Couldn't load revision history." onRetry={revisions.refetch} />
      )}
      {revisions.status === "success" && revisions.data.length === 0 && (
        <p className="font-body text-[13px] text-graphite-500">
          No earlier versions yet — one is saved automatically each time you save changes.
        </p>
      )}
      {revisions.status === "success" && revisions.data.length > 0 && (
        <ul className="space-y-2">
          {revisions.data.map((revision) => (
            <li
              key={revision.id}
              className="flex items-center justify-between gap-3 rounded border border-graphite-200 px-3 py-2 dark:border-graphite-800"
            >
              <span className="font-body text-[13px] text-graphite-600 dark:text-graphite-300">
                {new Date(revision.createdAt).toLocaleString()}
              </span>
              <Button
                variant="secondary"
                size="sm"
                type="button"
                onClick={() => setRestoreTarget(revision.id)}
              >
                Restore
              </Button>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={!!restoreTarget}
        title="Restore this version?"
        description="This replaces the current draft content with this earlier version. You'll still need to publish it to make it live."
        confirmLabel="Restore"
        onConfirm={handleRestore}
        onCancel={() => setRestoreTarget(null)}
        loading={restoring}
      />
    </div>
  );
}
