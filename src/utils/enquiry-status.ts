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

/**
 * Enquiry status lifecycle, modeled after how CRMs like Salesforce treat
 * "lead conversion": most statuses are freely reversible working states,
 * but "converted" is a terminal, locked state you don't reach or leave via
 * a plain dropdown edit.
 *
 *        ┌────────────────────────────────────────┐
 *        │                                         ▼
 *  new ──┼──► contacted ──► not_available ──► closed
 *   ▲    │        │  ▲            │  ▲           │
 *   │    │        ▼  │            ▼  │           │
 *   │    └──► converted (terminal — reached only via                  
 *   │         "Convert to Rental" / the pending-items confirm dialog,  
 *   │         left only via the explicit "Reopen enquiry" action)      
 *   └───────────────────────────────────────────────────────┘
 *          (closed / not_available can always reopen to "new")
 *
 * `converted` is deliberately left out of every list here — it's not a
 * normal dropdown destination. EnquiryDetail enters it only through the
 * dedicated convert flow (or the "set anyway" escape hatch for
 * already-fully-converted items), and leaves it only through the
 * dedicated "Reopen enquiry" action, never a raw status edit. See
 * EnquiryDetail.tsx.
 */
export const ENQUIRY_STATUS_TRANSITIONS: Record<Exclude<EnquiryStatus, "converted">, EnquiryStatus[]> = {
  new: ["contacted", "not_available", "closed"],
  contacted: ["new", "not_available", "closed"],
  not_available: ["new", "contacted", "closed"],
  closed: ["new"],
};

/**
 * The status a converted enquiry falls back to when reopened. "contacted"
 * (rather than "new") reflects that this enquiry has already been acted
 * on — reopening it isn't the same as it just having arrived.
 */
export const REOPEN_TARGET_STATUS: EnquiryStatus = "contacted";
