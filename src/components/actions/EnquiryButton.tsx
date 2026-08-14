import { useNavigate } from "react-router-dom";
import { Button } from "../ui/Button";

interface EnquiryButtonProps {
  productId?: string;
  productName?: string;
  fullWidth?: boolean;
  label?: string;
}

export function EnquiryButton({
  productId,
  productName,
  fullWidth,
  label = "Enquire",
}: EnquiryButtonProps) {
  const navigate = useNavigate();

  return (
    <Button
      variant="primary"
      fullWidth={fullWidth}
      onClick={() =>
        navigate("/enquire", { state: { productId, productName } })
      }
    >
      {label}
    </Button>
  );
}
