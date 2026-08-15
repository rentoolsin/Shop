import { useNavigate } from "react-router-dom";
import { Button } from "../ui/Button";

interface RequestPurchaseButtonProps {
  productName?: string;
  fullWidth?: boolean;
  label?: string;
  className?: string;
}

export function RequestPurchaseButton({
  productName,
  fullWidth,
  label = "Request this tool",
  className = "",
}: RequestPurchaseButtonProps) {
  const navigate = useNavigate();

  return (
    <Button
      variant="accent"
      fullWidth={fullWidth}
      className={className}
      onClick={() => navigate("/request-purchase", { state: { productName } })}
    >
      {label}
    </Button>
  );
}
