import { useEffect, useState, type FormEvent } from "react";
import { useAdminSiteSettings } from "../../hooks/useAdminData";
import { updateSiteSettings } from "../../services/admin-site-settings.service";
import { useTheme } from "../../lib/theme";
import { useAuth } from "../../lib/auth";
import { supabase } from "../../lib/supabase";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { LoadingState } from "../../components/ui/LoadingState";
import { ErrorState } from "../../components/ui/ErrorState";
import { useToast } from "../../components/ui/Toast";
import type { SiteSettings } from "../../utils/site-settings";

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
      <div className="mt-3 space-y-3 rounded-lg border border-graphite-200 bg-white p-4 dark:border-graphite-800 dark:bg-graphite-900">
        {children}
      </div>
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
        {submitting ? "Saving…" : "Save contact info"}
      </Button>
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
              ? "bg-graphite-900 text-graphite-25 dark:bg-signal-500 dark:text-graphite-950"
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

      <SettingsSection title="Appearance" description="Applies to this admin session.">
        <AppearanceSettings />
      </SettingsSection>

      <SettingsSection title="Admin account">
        <AccountSettingsForm />
      </SettingsSection>
    </div>
  );
}
