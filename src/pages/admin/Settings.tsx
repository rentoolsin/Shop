import { useEffect, useState, type FormEvent } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { useAdminSiteSettings } from "../../hooks/useAdminData";
import { updateSiteSettings } from "../../services/admin-site-settings.service";
import { useTheme } from "../../lib/theme";
import { useAuth } from "../../lib/auth";
import { supabase } from "../../lib/supabase";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { LoadingState } from "../../components/ui/LoadingState";
import { ErrorState } from "../../components/ui/ErrorState";
import { useToast } from "../../components/ui/Toast";
import type { SiteSettings } from "../../utils/site-settings";
import {
  BOTTOM_NAV_ICONS,
  BOTTOM_NAV_ICON_NAMES,
  BOTTOM_NAV_PAGE_OPTIONS,
  BOTTOM_NAV_MIN_ITEMS,
  BOTTOM_NAV_MAX_ITEMS,
  DEFAULT_BOTTOM_NAV_ITEMS,
  type BottomNavItem,
} from "../../utils/bottom-nav";

const PHONE_RE = /^\+[0-9]{10,13}$/;
const WHATSAPP_RE = /^[0-9]{10,13}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function SettingsSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-8">
      <h2 className="font-display text-[16px] font-semibold text-ink dark:text-ink-inverted">
        {title}
      </h2>
      {description && (
        <p className="mt-1 font-body text-[13px] text-graphite-500">{description}</p>
      )}
      <Card className="mt-3 space-y-3 p-4">{children}</Card>
    </section>
  );
}

function ContactSettingsForm() {
  const { showToast } = useToast();
  const settings = useAdminSiteSettings();
  const [values, setValues] = useState<SiteSettings | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof SiteSettings, string>>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (settings.status === "success") setValues(settings.data);
  }, [settings.status, settings.data]);

  if (settings.status === "loading" || values === null) {
    return <LoadingState label="Loading contact settings…" />;
  }
  if (settings.status === "error") {
    return <ErrorState title="Couldn't load contact settings" onRetry={settings.refetch} />;
  }

  const setField = (field: keyof SiteSettings, value: string) => {
    setValues((v) => (v ? { ...v, [field]: value } : v));
  };

  const validate = (): boolean => {
    const next: typeof errors = {};
    if (!PHONE_RE.test(values.phone.trim())) {
      next.phone = "Use E.164 format, e.g. +91XXXXXXXXXX.";
    }
    if (!WHATSAPP_RE.test(values.whatsapp.trim())) {
      next.whatsapp = "Digits only with country code, e.g. 91XXXXXXXXXX.";
    }
    if (!EMAIL_RE.test(values.email.trim())) {
      next.email = "Enter a valid email address.";
    }
    if (!values.address.trim()) {
      next.address = "Enter a business address.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting || !validate()) return;
    setSubmitting(true);
    try {
      await updateSiteSettings(values);
      showToast("Contact info updated.", "success");
      settings.refetch();
    } catch {
      showToast("Couldn't save contact info. Try again.", "danger");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3" noValidate>
      <Input
        label="Phone (for calls)"
        value={values.phone}
        onChange={(e) => setField("phone", e.target.value)}
        error={errors.phone}
        hint="E.164 format, used for the Call button."
      />
      <Input
        label="WhatsApp number"
        value={values.whatsapp}
        onChange={(e) => setField("whatsapp", e.target.value)}
        error={errors.whatsapp}
        hint="Digits only with country code, used for the WhatsApp button."
      />
      <Input
        label="Email"
        type="email"
        value={values.email}
        onChange={(e) => setField("email", e.target.value)}
        error={errors.email}
      />
      <Input
        label="Address"
        value={values.address}
        onChange={(e) => setField("address", e.target.value)}
        error={errors.address}
        hint="Shown on the Location page and used for the Maps link."
      />
      <Button type="submit" disabled={submitting} fullWidth>
        {submitting ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}

const CUSTOM_PATH_VALUE = "__custom__";

function makeItemId() {
  return `nav-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function BottomNavItemRow({
  item,
  index,
  total,
  onChange,
  onRemove,
  onMove,
}: {
  item: BottomNavItem;
  index: number;
  total: number;
  onChange: (next: BottomNavItem) => void;
  onRemove: () => void;
  onMove: (direction: -1 | 1) => void;
}) {
  const isKnownPage = BOTTOM_NAV_PAGE_OPTIONS.some((p) => p.path === item.path);
  const [useCustomPath, setUseCustomPath] = useState(!isKnownPage);
  const Icon = BOTTOM_NAV_ICONS[item.icon];

  return (
    <div className="rounded-lg border border-graphite-200 p-3 dark:border-graphite-800">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-graphite-100 text-graphite-600 dark:bg-graphite-800 dark:text-graphite-300">
            <Icon size={16} strokeWidth={1.8} />
          </span>
          <span className="font-body text-[12px] font-medium text-graphite-500">
            Tab {index + 1}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Move up"
            disabled={index === 0}
            onClick={() => onMove(-1)}
            className="flex h-8 w-8 items-center justify-center rounded text-graphite-500 hover:bg-graphite-100 disabled:opacity-30 disabled:hover:bg-transparent dark:hover:bg-graphite-800"
          >
            <ArrowUp size={16} />
          </button>
          <button
            type="button"
            aria-label="Move down"
            disabled={index === total - 1}
            onClick={() => onMove(1)}
            className="flex h-8 w-8 items-center justify-center rounded text-graphite-500 hover:bg-graphite-100 disabled:opacity-30 disabled:hover:bg-transparent dark:hover:bg-graphite-800"
          >
            <ArrowDown size={16} />
          </button>
          <button
            type="button"
            aria-label="Remove tab"
            disabled={total <= BOTTOM_NAV_MIN_ITEMS}
            onClick={onRemove}
            className="flex h-8 w-8 items-center justify-center rounded text-state-danger-text hover:bg-graphite-100 disabled:opacity-30 disabled:hover:bg-transparent dark:hover:bg-graphite-800"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Select
          label="Icon"
          value={item.icon}
          onChange={(e) => onChange({ ...item, icon: e.target.value as BottomNavItem["icon"] })}
        >
          {BOTTOM_NAV_ICON_NAMES.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </Select>
        <Input
          label="Label"
          value={item.label}
          onChange={(e) => onChange({ ...item, label: e.target.value })}
        />
      </div>

      <div className="mt-2">
        <Select
          label="Links to"
          value={useCustomPath ? CUSTOM_PATH_VALUE : item.path}
          onChange={(e) => {
            const next = e.target.value;
            if (next === CUSTOM_PATH_VALUE) {
              setUseCustomPath(true);
              return;
            }
            setUseCustomPath(false);
            onChange({ ...item, path: next });
          }}
        >
          {BOTTOM_NAV_PAGE_OPTIONS.map((page) => (
            <option key={page.path} value={page.path}>
              {page.label} ({page.path})
            </option>
          ))}
          <option value={CUSTOM_PATH_VALUE}>Custom page…</option>
        </Select>
        {useCustomPath && (
          <Input
            className="mt-2"
            placeholder="/any-page"
            value={item.path}
            onChange={(e) => onChange({ ...item, path: e.target.value })}
            hint="Any page in the app, e.g. /products/some-slug or /about."
          />
        )}
      </div>
    </div>
  );
}

function BottomNavSettingsForm() {
  const { showToast } = useToast();
  const settings = useAdminSiteSettings();
  const [values, setValues] = useState<SiteSettings | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (settings.status === "success") setValues(settings.data);
  }, [settings.status, settings.data]);

  if (settings.status === "loading" || values === null) {
    return <LoadingState label="Loading bottom navigation…" />;
  }
  if (settings.status === "error") {
    return <ErrorState title="Couldn't load bottom navigation" onRetry={settings.refetch} />;
  }

  const items = values.bottomNavItems;

  const setItems = (next: BottomNavItem[]) => {
    setValues((v) => (v ? { ...v, bottomNavItems: next } : v));
  };

  const updateItem = (index: number, next: BottomNavItem) => {
    setItems(items.map((it, i) => (i === index ? next : it)));
  };

  const removeItem = (index: number) => {
    if (items.length <= BOTTOM_NAV_MIN_ITEMS) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const moveItem = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    setItems(next);
  };

  const addItem = () => {
    if (items.length >= BOTTOM_NAV_MAX_ITEMS) return;
    setItems([...items, { id: makeItemId(), label: "New tab", icon: "star", path: "/" }]);
  };

  const resetToDefaults = () => {
    setItems(DEFAULT_BOTTOM_NAV_ITEMS.map((it) => ({ ...it })));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    if (items.length < BOTTOM_NAV_MIN_ITEMS) {
      showToast(`Keep at least ${BOTTOM_NAV_MIN_ITEMS} tabs.`, "danger");
      return;
    }
    if (items.some((it) => !it.label.trim() || !it.path.trim())) {
      showToast("Every tab needs a label and a page.", "danger");
      return;
    }
    setSubmitting(true);
    try {
      await updateSiteSettings(values);
      showToast("Bottom navigation updated.", "success");
      settings.refetch();
    } catch {
      showToast("Couldn't save bottom navigation. Try again.", "danger");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="space-y-3">
        {items.map((item, index) => (
          <BottomNavItemRow
            key={item.id}
            item={item}
            index={index}
            total={items.length}
            onChange={(next) => updateItem(index, next)}
            onRemove={() => removeItem(index)}
            onMove={(direction) => moveItem(index, direction)}
          />
        ))}
      </div>

      <Button
        type="button"
        variant="secondary"
        fullWidth
        disabled={items.length >= BOTTOM_NAV_MAX_ITEMS}
        onClick={addItem}
      >
        <Plus size={16} /> Add tab
      </Button>

      <div className="flex gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={resetToDefaults}>
          Reset to defaults
        </Button>
        <Button type="submit" disabled={submitting} fullWidth>
          {submitting ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}

function AppearanceSettings() {
  const { preference, setPreference } = useTheme();
  const options: { value: "light" | "dark" | "system"; label: string }[] = [
    { value: "light", label: "Light" },
    { value: "dark", label: "Dark" },
    { value: "system", label: "System" },
  ];

  return (
    <div className="flex gap-2">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => setPreference(option.value)}
          aria-pressed={preference === option.value}
          className={[
            "flex-1 rounded px-3 py-2 font-body text-[13px] font-medium transition-colors duration-150 ease-app",
            preference === option.value
              ? "bg-graphite-900 text-graphite-25 dark:bg-white dark:text-graphite-950"
              : "bg-graphite-100 text-graphite-600 hover:bg-graphite-200 dark:bg-graphite-800 dark:text-graphite-300 dark:hover:bg-graphite-700",
          ].join(" ")}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function AccountSettingsForm() {
  const { showToast } = useToast();
  const { session } = useAuth();

  const [email, setEmail] = useState(session?.user.email ?? "");
  const [emailSubmitting, setEmailSubmitting] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const handleEmailSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (emailSubmitting) return;
    setEmailError(null);
    if (!EMAIL_RE.test(email.trim())) {
      setEmailError("Enter a valid email address.");
      return;
    }
    if (email.trim() === session?.user.email) {
      showToast("That's already your current email.", "default");
      return;
    }
    setEmailSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({ email: email.trim() });
      if (error) throw error;
      showToast("Check your inbox to confirm the new email address.", "success");
    } catch {
      showToast("Couldn't update email. Try again.", "danger");
    } finally {
      setEmailSubmitting(false);
    }
  };

  const handlePasswordSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (passwordSubmitting) return;
    setPasswordError(null);
    if (newPassword.length < 8) {
      setPasswordError("Use at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords don't match.");
      return;
    }
    setPasswordSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      showToast("Password updated.", "success");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      showToast("Couldn't update password. Try again.", "danger");
    } finally {
      setPasswordSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleEmailSubmit} className="space-y-3" noValidate>
        <Input
          label="Admin email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={emailError ?? undefined}
        />
        <Button type="submit" variant="secondary" disabled={emailSubmitting} fullWidth>
          {emailSubmitting ? "Updating…" : "Update email"}
        </Button>
      </form>

      <form onSubmit={handlePasswordSubmit} className="space-y-3" noValidate>
        <Input
          label="New password"
          type="password"
          autoComplete="new-password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          error={passwordError ?? undefined}
        />
        <Input
          label="Confirm new password"
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
        <Button type="submit" variant="secondary" disabled={passwordSubmitting} fullWidth>
          {passwordSubmitting ? "Updating…" : "Update password"}
        </Button>
      </form>
    </div>
  );
}

export function Settings() {
  return (
    <div className="max-w-md">
      <h1 className="mb-6 font-display text-[20px] font-bold text-ink dark:text-ink-inverted">
        Settings
      </h1>

      <SettingsSection
        title="Business contact info"
        description="Shown across the public site — Call/WhatsApp buttons, Contact, and Location pages."
      >
        <ContactSettingsForm />
      </SettingsSection>

      <SettingsSection
        title="Bottom navigation"
        description="Customize the tabs shown in the customer app's bottom bar — icon, name, page, and order. Any page in the app can be added."
      >
        <BottomNavSettingsForm />
      </SettingsSection>

      <SettingsSection title="Appearance" description="Applies to this admin session.">
        <AppearanceSettings />
      </SettingsSection>

      <SettingsSection title="Admin account">
        <AccountSettingsForm />
      </SettingsSection>
    </div>
  );
}
