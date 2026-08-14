// Hand-written to match supabase/migrations/0001_init_schema.sql.
// Once a real Supabase project is linked, regenerate with:
//   supabase gen types typescript --project-id <id> > src/types/database.ts
// and this file becomes generated, not hand-maintained.

export type RentalStatus =
  | "active"
  | "due_today"
  | "returned"
  | "overdue"
  | "cancelled";

export type EnquiryStatus =
  | "new"
  | "contacted"
  | "converted"
  | "not_available"
  | "closed";

export type PurchaseRequestStatus =
  | "requested"
  | "sourcing"
  | "fulfilled"
  | "declined";

export interface Database {
  public: {
    Tables: {
      categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          image_url: string | null;
          sort_order: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["categories"]["Row"]> & {
          name: string;
          slug: string;
        };
        Update: Partial<Database["public"]["Tables"]["categories"]["Row"]>;
        Relationships: [];
      };
      products: {
        Row: {
          id: string;
          category_id: string;
          name: string;
          slug: string;
          description: string | null;
          image_url: string | null;
          is_featured: boolean;
          is_active: boolean;
          sort_order: number;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["products"]["Row"]> & {
          category_id: string;
          name: string;
          slug: string;
        };
        Update: Partial<Database["public"]["Tables"]["products"]["Row"]>;
        Relationships: [];
      };
      product_variants: {
        Row: {
          id: string;
          product_id: string;
          label: string; // e.g. "8 ft"
          daily_rate: number;
          quantity_total: number;
          quantity_reserved: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: Partial<
          Database["public"]["Tables"]["product_variants"]["Row"]
        > & {
          product_id: string;
          label: string;
          daily_rate: number;
          quantity_total: number;
        };
        Update: Partial<Database["public"]["Tables"]["product_variants"]["Row"]>;
        Relationships: [];
      };
      product_images: {
        Row: {
          id: string;
          product_id: string;
          image_url: string;
          sort_order: number;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["product_images"]["Row"]> & {
          product_id: string;
          image_url: string;
        };
        Update: Partial<Database["public"]["Tables"]["product_images"]["Row"]>;
        Relationships: [];
      };
      customers: {
        Row: {
          id: string;
          name: string;
          mobile: string;
          address: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["customers"]["Row"]> & {
          name: string;
          mobile: string;
        };
        Update: Partial<Database["public"]["Tables"]["customers"]["Row"]>;
        Relationships: [];
      };
      rentals: {
        Row: {
          id: string;
          customer_id: string;
          variant_id: string;
          quantity: number;
          start_date: string;
          return_date: string;
          daily_rate: number;
          advance: number;
          status: RentalStatus;
          actual_return_date: string | null;
          enquiry_id: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["rentals"]["Row"]> & {
          customer_id: string;
          variant_id: string;
          quantity: number;
          start_date: string;
          return_date: string;
          daily_rate: number;
        };
        Update: Partial<Database["public"]["Tables"]["rentals"]["Row"]>;
        Relationships: [];
      };
      enquiries: {
        Row: {
          id: string;
          name: string;
          mobile: string;
          product_id: string | null;
          requested_product_text: string | null;
          quantity: number | null;
          required_date: string | null;
          number_of_days: number | null;
          address: string | null;
          message: string | null;
          status: EnquiryStatus;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["enquiries"]["Row"]> & {
          name: string;
          mobile: string;
        };
        Update: Partial<Database["public"]["Tables"]["enquiries"]["Row"]>;
        Relationships: [];
      };
      purchase_requests: {
        Row: {
          id: string;
          product_requested: string;
          customer_id: string | null;
          name: string | null;
          mobile: string | null;
          quantity: number | null;
          priority: "low" | "normal" | "high";
          notes: string | null;
          status: PurchaseRequestStatus;
          created_at: string;
        };
        Insert: Partial<
          Database["public"]["Tables"]["purchase_requests"]["Row"]
        > & {
          product_requested: string;
        };
        Update: Partial<Database["public"]["Tables"]["purchase_requests"]["Row"]>;
        Relationships: [];
      };
      homepage_content: {
        Row: {
          id: string;
          section_key: string;
          content: Record<string, unknown>;
          is_enabled: boolean;
          sort_order: number;
          is_published: boolean;
          updated_at: string;
        };
        Insert: Partial<
          Database["public"]["Tables"]["homepage_content"]["Row"]
        > & {
          section_key: string;
          content: Record<string, unknown>;
        };
        Update: Partial<Database["public"]["Tables"]["homepage_content"]["Row"]>;
        Relationships: [];
      };
      homepage_content_revisions: {
        Row: {
          id: string;
          section_key: string;
          content: Record<string, unknown>;
          created_at: string;
        };
        Insert: Partial<
          Database["public"]["Tables"]["homepage_content_revisions"]["Row"]
        > & {
          section_key: string;
          content: Record<string, unknown>;
        };
        Update: Partial<
          Database["public"]["Tables"]["homepage_content_revisions"]["Row"]
        >;
        Relationships: [];
      };
      site_settings: {
        Row: {
          id: boolean;
          phone: string;
          whatsapp: string;
          email: string;
          address: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["site_settings"]["Row"]> & {
          id?: boolean;
          phone: string;
          whatsapp: string;
          email: string;
          address: string;
        };
        Update: Partial<Database["public"]["Tables"]["site_settings"]["Row"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      sync_rental_open_statuses: {
        Args: Record<string, never>;
        Returns: number;
      };
      admin_save_product_with_variants: {
        Args: {
          p_product_id: string | null;
          p_name: string;
          p_slug: string;
          p_description: string | null;
          p_image_url: string | null;
          p_category_id: string;
          p_is_featured: boolean;
          p_is_active: boolean;
          p_sort_order: number;
          p_variants: Array<{
            id: string | null;
            label: string;
            dailyRate: number;
            quantityTotal: number;
            isActive: boolean;
          }>;
          p_images?: Array<{
            id: string | null;
            imageUrl: string;
            sortOrder: number;
          }>;
        };
        Returns: string;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
