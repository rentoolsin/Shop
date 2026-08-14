import { MessageCircle } from "lucide-react";
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
        <MessageCircle className="h-4 w-4" strokeWidth={1.8} />
        {label}
      </span>
    </Button>
  );
}
