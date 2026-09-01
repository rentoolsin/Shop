import { useAsyncData } from "./useAsyncData";
import { fetchAllCategories, fetchCategoryById } from "../services/admin-categories.service";
import {
  fetchAllProducts,
  fetchProductForEdit,
  fetchProductInventorySummary,
} from "../services/admin-products.service";
import { fetchAllCustomers, fetchCustomerById } from "../services/admin-customers.service";
import { fetchAllRentals, fetchRentalPayments } from "../services/admin-rentals.service";
import { fetchAllEnquiries, fetchEnquiryById, fetchNewEnquiriesCount } from "../services/admin-enquiries.service";
import {
  fetchAllPurchaseRequests,
  fetchPurchaseRequestById,
  fetchOpenPurchaseRequestsCount,
} from "../services/admin-purchase-requests.service";
import {
  fetchAllHomepageSections,
  fetchHomepageSection,
  fetchHomepageRevisions,
} from "../services/admin-homepage-content.service";
import type { HomepageSectionKey } from "../utils/homepage-content";
import { fetchAdminSiteSettings } from "../services/admin-site-settings.service";
import { fetchAllAdminLocations, fetchLocationById } from "../services/admin-locations.service";

// Product data spans three tables (a variant or image change doesn't touch
// the product row itself), so anything reading products watches all three.
const PRODUCT_TABLES = ["products", "product_variants", "product_images"];

export function useAdminCategories() {
  return useAsyncData(fetchAllCategories, [], { realtimeTables: ["categories"] });
}

export function useAdminCategory(id: string | undefined) {
  return useAsyncData(() => (id ? fetchCategoryById(id) : Promise.resolve(null)), [id], {
    realtimeTables: ["categories"],
  });
}

export function useAdminProducts() {
  return useAsyncData(fetchAllProducts, [], { realtimeTables: PRODUCT_TABLES });
}

export function useAdminProduct(id: string | undefined) {
  return useAsyncData(() => (id ? fetchProductForEdit(id) : Promise.resolve(null)), [id], {
    realtimeTables: PRODUCT_TABLES,
  });
}

export function useAdminProductInventory() {
  // Availability depends on active rentals too, not just variant stock.
  return useAsyncData(fetchProductInventorySummary, [], {
    realtimeTables: ["product_variants", "rentals"],
  });
}

export function useAdminCustomers(query = "") {
  return useAsyncData(() => fetchAllCustomers(query), [query], { realtimeTables: ["customers"] });
}

export function useAdminCustomer(id: string | undefined) {
  return useAsyncData(() => (id ? fetchCustomerById(id) : Promise.resolve(null)), [id], {
    realtimeTables: ["customers"],
  });
}

export function useAdminRentals() {
  return useAsyncData(fetchAllRentals, [], { realtimeTables: ["rentals"] });
}

/** Payment history for one rental — fetched on demand (e.g. when a details popup opens). */
export function useAdminRentalPayments(rentalId: string | undefined) {
  return useAsyncData(
    () => (rentalId ? fetchRentalPayments(rentalId) : Promise.resolve([])),
    [rentalId],
    { realtimeTables: ["rental_payments"] },
  );
}

export function useAdminEnquiries(query = "") {
  return useAsyncData(() => fetchAllEnquiries(query), [query], { realtimeTables: ["enquiries"] });
}

export function useAdminEnquiry(id: string | undefined) {
  return useAsyncData(() => (id ? fetchEnquiryById(id) : Promise.resolve(null)), [id], {
    realtimeTables: ["enquiries", "enquiry_items"],
  });
}

/** Count of "new" enquiries, for the Requests tab badge — see AdminMobileNav. */
export function useNewEnquiriesCount() {
  return useAsyncData(fetchNewEnquiriesCount, [], { realtimeTables: ["enquiries"] });
}

export function useAdminPurchaseRequests(query = "") {
  return useAsyncData(() => fetchAllPurchaseRequests(query), [query], {
    realtimeTables: ["purchase_requests"],
  });
}

/** Count of open ("requested"/"sourcing") purchase requests, for the More tab / quick-pick sheet badge — see AdminMobileNav. */
export function useOpenPurchaseRequestsCount() {
  return useAsyncData(fetchOpenPurchaseRequestsCount, [], { realtimeTables: ["purchase_requests"] });
}

export function useAdminPurchaseRequest(id: string | undefined) {
  return useAsyncData(() => (id ? fetchPurchaseRequestById(id) : Promise.resolve(null)), [id], {
    realtimeTables: ["purchase_requests"],
  });
}

export function useAdminHomepageSections() {
  return useAsyncData(fetchAllHomepageSections, [], { realtimeTables: ["homepage_content"] });
}

export function useAdminHomepageSection(key: HomepageSectionKey) {
  return useAsyncData(() => fetchHomepageSection(key), [key], {
    realtimeTables: ["homepage_content"],
  });
}

export function useAdminHomepageRevisions(key: HomepageSectionKey) {
  return useAsyncData(() => fetchHomepageRevisions(key), [key], {
    realtimeTables: ["homepage_content_revisions"],
  });
}

export function useAdminSiteSettings() {
  return useAsyncData(fetchAdminSiteSettings, [], { realtimeTables: ["site_settings"] });
}

export function useAdminLocations() {
  return useAsyncData(fetchAllAdminLocations, [], { realtimeTables: ["locations"] });
}

export function useAdminLocation(id: string | undefined) {
  return useAsyncData(() => (id ? fetchLocationById(id) : Promise.resolve(null)), [id], {
    realtimeTables: ["locations"],
  });
}
