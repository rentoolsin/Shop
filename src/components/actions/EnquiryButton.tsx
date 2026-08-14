import { useNavigate } from "react-router-dom";
import { Button } from "../ui/Button";

interface EnquiryButtonProps {
  productId?: string;
  productName?: string;
  fullWidth?: boolean;
  label?: string;
  className?: string;
}

function ChatIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.8} className="h-4 w-4">
      <path
        d="M4 20l1.4-4.2A8 8 0 1 1 9 18.6L4 20Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function EnquiryButton({
  productId,
  productName,
  fullWidth,
  label = "Enquiry",
  className = "",
}: EnquiryButtonProps) {
  const navigate = useNavigate();

  return (
    <Button
      variant="outline"
      fullWidth={fullWidth}
      className={className}
      onClick={() =>
        navigate("/enquire", { state: { productId, productName } })
      }
    >
      <span className="inline-flex items-center gap-2">
        <ChatIcon />
        {label}
      </span>
    </Button>
  );
}
