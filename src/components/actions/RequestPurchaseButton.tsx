import { useNavigate } from "react-router-dom";
import { Button } from "../ui/Button";

interface RequestPurchaseButtonProps {
  productName?: string;
  fullWidth?: boolean;
  label?: string;
}

export function RequestPurchaseButton({
  productName,
  fullWidth,
  label = "Request when in stock",
}: RequestPurchaseButtonProps) {
  const navigate = useNavigate();

  return (
    <Button
      variant="primary"
      fullWidth={fullWidth}
      onClick={() => navigate("/request-purchase", { state: { productName } })}
    >
      {label}
    </Button>
  );
}
