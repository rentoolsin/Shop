/**
 * Shared validation for the three fields nearly every customer-facing form
 * collects: name, mobile number, address. Centralized here so "a valid
 * name/mobile/address" means the same thing everywhere in the app —
 * previously each form (Enquire, RequestPurchase, the admin Enquiry editor,
 * CustomerForm) had its own slightly different rules, and only
 * CustomerForm actually checked the mobile number was a real Indian
 * number rather than just the right number of digits.
 */

// Indian mobile numbers: 10 digits, first digit 6-9, optional +91/91/0
// national prefix. Anchored to the real national format (not just digit
// *count*) so junk like "888888888888" — 12 digits, but not a real
// number — is rejected. A plain `/^\+?[0-9]{10,13}$/` count-only check lets
// that through.
export const MOBILE_RE = /^(?:\+91|91|0)?[6-9]\d{9}$/;
const ALL_SAME_DIGIT_RE = /^(\d)\1{9}$/;
const HAS_LETTER_RE = /[A-Za-z]/;
export const MIN_NAME_LENGTH = 2;

/**
 * Strips spaces, hyphens, dots, and parens — the formatting people paste
 * numbers in with (e.g. "+91 96555 91196", "91-9655591196") — so those
 * still validate instead of being rejected for punctuation MOBILE_RE
 * never expected to see.
 */
export function sanitizeMobile(mobile: string): string {
  return mobile.trim().replace(/[\s().-]/g, "");
}

/** Sanitizes, then strips a leading +91/91/0 so callers always store/compare the bare 10-digit number. */
export function normalizeMobile(mobile: string): string {
  return sanitizeMobile(mobile).replace(/^(?:\+91|91|0)/, "");
}

/** @returns an error string, or undefined if the name is valid. */
export function validateName(name: string): string | undefined {
  const trimmed = name.trim();
  if (!trimmed) return "Enter your name.";
  if (trimmed.length < MIN_NAME_LENGTH) return "Name is too short.";
  if (!HAS_LETTER_RE.test(trimmed)) return "Name must contain letters.";
  return undefined;
}

/**
 * @param mobile Raw field value, any punctuation.
 * @param options.optional When true, an empty value is valid (for
 * secondary/alternate numbers). Defaults to required.
 * @returns an error string, or undefined if the number is valid.
 */
export function validateMobile(mobile: string, options?: { optional?: boolean }): string | undefined {
  const sanitized = sanitizeMobile(mobile);
  if (!sanitized) return options?.optional ? undefined : "Enter a mobile number.";
  if (!MOBILE_RE.test(sanitized)) return "Enter a valid 10-digit Indian mobile number.";
  if (ALL_SAME_DIGIT_RE.test(normalizeMobile(sanitized))) return "That doesn't look like a real number.";
  return undefined;
}

/** @returns an error string, or undefined if the address is valid (or blank and optional). */
export function validateAddress(
  address: string,
  options?: { optional?: boolean; requiredMessage?: string },
): string | undefined {
  const trimmed = address.trim();
  if (!trimmed) return options?.optional ? undefined : (options?.requiredMessage ?? "Enter the address.");
  return undefined;
}
