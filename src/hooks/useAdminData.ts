import { useAsyncData } from "./useAsyncData";
import { fetchAllCategories, fetchCategoryById } from "../services/admin-categories.service";
import {
  fetchAllProducts,
  fetchProductForEdit,
  fetchProductInventorySummary,
} from "../services/admin-products.service";
import { fetchAllCustomers, fetchCustomerById } from "../services/admin-customers.service";
import { fetchAllRentals } from "../services/admin-rentals.service";
import { fetchAllEnquiries, fetchEnquiryById } from "../services/admin-enquiries.service";
import {
  fetchAllPurchaseRequests,
  fetchPurchaseRequestById,
} from "../services/admin-purchase-requests.service";
import {
  fetchAllHomepageSections,
  fetchHomepageSection,
  fetchHomepageRevisions,
} from "../services/admin-homepage-content.service";
import type { HomepageSectionKey } from "../utils/homepage-content";
import { fetchAdminSiteSettings } from "../services/admin-site-settings.service";

export function useAdminCategories() {
  return useAsyncData(fetchAllCategories, []);
}

export function useAdminCategory(id: string | undefined) {
  return useAsyncData(() => (id ? fetchCategoryById(id) : Promise.resolve(null)), [id]);
}

export function useAdminProducts() {
  return useAsyncData(fetchAllProducts, []);
}

export function useAdminProduct(id: string | undefined) {
  return useAsyncData(() => (id ? fetchProductForEdit(id) : Promise.resolve(null)), [id]);
}

export function useAdminProductInventory() {
  return useAsyncData(fetchProductInventorySummary, []);
}

export function useAdminCustomers(query = "") {
  return useAsyncData(() => fetchAllCustomers(query), [query]);
}

export function useAdminCustomer(id: string | undefined) {
  return useAsyncData(() => (id ? fetchCustomerById(id) : Promise.resolve(null)), [id]);
}

export function useAdminRentals() {
  return useAsyncData(fetchAllRentals, []);
}

export function useAdminEnquiries(query = "") {
  return useAsyncData(() => fetchAllEnquiries(query), [query]);
}

export function useAdminEnquiry(id: string | undefined) {
  return useAsyncData(() => (id ? fetchEnquiryById(id) : Promise.resolve(null)), [id]);
}

export function useAdminPurchaseRequests(query = "") {
  return useAsyncData(() => fetchAllPurchaseRequests(query), [query]);
}

export function useAdminPurchaseRequest(id: string | undefined) {
  return useAsyncData(() => (id ? fetchPurchaseRequestById(id) : Promise.resolve(null)), [id]);
}

export function useAdminHomepageSections() {
  return useAsyncData(fetchAllHomepageSections, []);
}

export function useAdminHomepageSection(key: HomepageSectionKey) {
  return useAsyncData(() => fetchHomepageSection(key), [key]);
}

export function useAdminHomepageRevisions(key: HomepageSectionKey) {
  return useAsyncData(() => fetchHomepageRevisions(key), [key]);
}

export function useAdminSiteSettings() {
  return useAsyncData(fetchAdminSiteSettings, []);
}
