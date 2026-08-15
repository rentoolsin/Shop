import { PageHeader } from "../components/layout/PageHeader";
import { CallButton } from "../components/actions/CallButton";
import { WhatsAppButton } from "../components/actions/WhatsAppButton";
import { useSiteSettings } from "../hooks/useSiteSettings";
import { SITE_SETTINGS_DEFAULTS } from "../utils/site-settings";

export function Contact() {
  const settings = useSiteSettings();
  // Best-effort like homepage CMS content: render defaults while loading
  // or on error rather than blocking or showing an error state for what
  // is, functionally, static contact info.
  const { phone, whatsapp, email } =
    settings.status === "success" ? settings.data : SITE_SETTINGS_DEFAULTS;

  return (
    <div>
      <PageHeader title="Contact" />
      <div className="space-y-4 p-4">
        <div className="flex gap-2">
          <CallButton phone={phone} fullWidth />
          <WhatsAppButton phone={whatsapp} fullWidth />
        </div>
        <a
          href={`mailto:${email}`}
          className="-mx-1 block rounded-lg px-1 py-2 font-body text-[14px] text-ink underline transition-colors active:bg-graphite-100 dark:text-ink-inverted dark:active:bg-graphite-800"
        >
          {email}
        </a>
      </div>
    </div>
  );
}
