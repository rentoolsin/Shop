import { Phone } from "@phosphor-icons/react";
import { Button } from "../ui/Button";

interface CallButtonProps {
  phone: string; // E.164 or local, e.g. "+91XXXXXXXXXX"
  label?: string;
  fullWidth?: boolean;
  className?: string;
}

export function CallButton({ phone, label = "Call", fullWidth, className = "" }: CallButtonProps) {
  return (
    <Button
      variant="outline"
      fullWidth={fullWidth}
      className={className}
      onClick={() => {
        window.location.href = `tel:${phone}`;
      }}
    >
      <span className="inline-flex items-center gap-2">
        <Phone className="h-4 w-4" weight="regular" />
        {label}
      </span>
    </Button>
  );
}
