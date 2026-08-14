import type { EnquiryStatus } from "../types/database";

export const STATUS_LABEL: Record<EnquiryStatus, string> = {
  new: "New",
  contacted: "Contacted",
  converted: "Converted to Rental",
  not_available: "Not Available",
  closed: "Closed",
};

export const STATUS_TONE: Record<EnquiryStatus, "neutral" | "success" | "warning" | "danger" | "info"> = {
  new: "info",
  contacted: "warning",
  converted: "success",
  not_available: "neutral",
  closed: "neutral",
};
