import { ChatCircle } from "@phosphor-icons/react";
import { useNavigate } from "react-router-dom";
import { Button } from "../ui/Button";

interface EnquiryButtonProps {
  productId?: string;
  productName?: string;
  dailyRate?: number;
  fullWidth?: boolean;
  label?: string;
  className?: string;
}

export function EnquiryButton({
  productId,
  productName,
  dailyRate,
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
        navigate("/enquire", { state: { productId, productName, dailyRate } })
      }
    >
      <span className="inline-flex items-center gap-2">
        <ChatCircle className="h-4 w-4" weight="regular" />
        {label}
      </span>
    </Button>
  );
}
