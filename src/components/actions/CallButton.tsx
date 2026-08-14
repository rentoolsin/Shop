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
        <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.8} className="h-4 w-4">
          <path
            d="M6.6 10.8c1.4 2.8 3.8 5.2 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.5.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.4c.6 0 1 .4 1 1 0 1.2.2 2.4.6 3.5.1.3 0 .7-.2 1L6.6 10.8Z"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {label}
      </span>
    </Button>
  );
}
