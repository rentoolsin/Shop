import type { PurchaseRequestStatus } from "../types/database";
import type { PurchaseRequestPriority } from "../services/admin-purchase-requests.service";

export const STATUS_LABEL: Record<PurchaseRequestStatus, string> = {
  requested: "Requested",
  sourcing: "Sourcing",
  fulfilled: "Fulfilled",
  declined: "Declined",
};

export const STATUS_TONE: Record<
  PurchaseRequestStatus,
  "neutral" | "success" | "warning" | "danger" | "info"
> = {
  requested: "info",
  sourcing: "warning",
  fulfilled: "success",
  declined: "neutral",
};

export const PRIORITY_LABEL: Record<PurchaseRequestPriority, string> = {
  low: "Low",
  normal: "Normal",
  high: "High",
};
