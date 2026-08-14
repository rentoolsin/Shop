import { Button } from "../ui/Button";

interface WhatsAppButtonProps {
  phone: string; // digits only, country code included, e.g. "91XXXXXXXXXX"
  message?: string;
  label?: string;
  fullWidth?: boolean;
}

export function WhatsAppButton({
  phone,
  message = "Hi RenTools, I'd like to ask about a tool rental.",
  label = "WhatsApp",
  fullWidth,
}: WhatsAppButtonProps) {
  const href = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

  return (
    <Button
      variant="primary"
      fullWidth={fullWidth}
      onClick={() => window.open(href, "_blank", "noopener,noreferrer")}
    >
      <span className="inline-flex items-center gap-2">
        <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.6} className="h-4 w-4">
          <path
            d="M4 20l1.4-4.2A8 8 0 1 1 9 18.6L4 20Z"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M9 10.5c.3 1.8 1.7 3.2 3.5 3.5"
            stroke="currentColor"
            strokeLinecap="round"
          />
        </svg>
        {label}
      </span>
    </Button>
  );
}
