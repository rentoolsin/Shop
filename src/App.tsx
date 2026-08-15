import { lazy, Suspense, useRef } from "react";
import { Route, Routes } from "react-router-dom";
import { BottomNavigation } from "./components/layout/BottomNavigation";
import { InstallAppBanner } from "./components/layout/InstallAppBanner";
import { PageTransition } from "./components/layout/PageTransition";
import { Footer } from "./components/layout/Footer";
import { FloatingWhatsApp } from "./components/actions/FloatingWhatsApp";
import { useScrollRestoration } from "./hooks/useScrollRestoration";
import { useManifestForRoute } from "./hooks/useManifestForRoute";
import { useReportBottomBarHeight, useBottomBarHeight } from "./hooks/useBottomBarHeight";
import { useSiteSettings } from "./hooks/useSiteSettings";
import { SITE_SETTINGS_DEFAULTS } from "./utils/site-settings";
import { LoadingState } from "./components/ui/LoadingState";
import { Home } from "./pages/Home";
import { Products } from "./pages/Products";
import { ProductDetail } from "./pages/ProductDetail";
import { CategoryDetail } from "./pages/CategoryDetail";
import { Search } from "./pages/Search";
import { Saved } from "./pages/Saved";
import { Cart } from "./pages/Cart";
import { About } from "./pages/About";
import { Contact } from "./pages/Contact";
import { Enquire } from "./pages/Enquire";
import { RequestPurchase } from "./pages/RequestPurchase";
import { NotFound } from "./pages/NotFound";
import { ProtectedRoute } from "./components/admin/ProtectedRoute";

// Admin pages are code-split from the public customer bundle: a customer
// browsing tools/rentals never needs admin form/table/report JS on their
// first load, and vice versa. `App.tsx`'s route table itself stays the
// single source of truth for admin routes (no duplicated route logic) —
// only *how* each admin module is imported changes.
const Login = lazy(() => import("./pages/admin/Login").then((m) => ({ default: m.Login })));
const Dashboard = lazy(() => import("./pages/admin/Dashboard").then((m) => ({ default: m.Dashboard })));
const CategoriesList = lazy(() =>
  import("./pages/admin/categories/CategoriesList").then((m) => ({ default: m.CategoriesList })),
);
const CategoryForm = lazy(() =>
  import("./pages/admin/categories/CategoryForm").then((m) => ({ default: m.CategoryForm })),
);
const ProductsList = lazy(() =>
  import("./pages/admin/products/ProductsList").then((m) => ({ default: m.ProductsList })),
);
const ProductForm = lazy(() =>
  import("./pages/admin/products/ProductForm").then((m) => ({ default: m.ProductForm })),
);
const CustomersList = lazy(() =>
  import("./pages/admin/customers/CustomersList").then((m) => ({ default: m.CustomersList })),
);
const CustomerForm = lazy(() =>
  import("./pages/admin/customers/CustomerForm").then((m) => ({ default: m.CustomerForm })),
);
const RentalsList = lazy(() =>
  import("./pages/admin/rentals/RentalsList").then((m) => ({ default: m.RentalsList })),
);
const RentalForm = lazy(() =>
  import("./pages/admin/rentals/RentalForm").then((m) => ({ default: m.RentalForm })),
);
const EnquiriesList = lazy(() =>
  import("./pages/admin/enquiries/EnquiriesList").then((m) => ({ default: m.EnquiriesList })),
);
const EnquiryDetail = lazy(() =>
  import("./pages/admin/enquiries/EnquiryDetail").then((m) => ({ default: m.EnquiryDetail })),
);
const PurchaseRequestsList = lazy(() =>
  import("./pages/admin/purchase-requests/PurchaseRequestsList").then((m) => ({
    default: m.PurchaseRequestsList,
  })),
);
const PurchaseRequestDetail = lazy(() =>
  import("./pages/admin/purchase-requests/PurchaseRequestDetail").then((m) => ({
    default: m.PurchaseRequestDetail,
  })),
);
const PurchaseRequestForm = lazy(() =>
  import("./pages/admin/purchase-requests/PurchaseRequestForm").then((m) => ({
    default: m.PurchaseRequestForm,
  })),
);
const Reports = lazy(() => import("./pages/admin/Reports").then((m) => ({ default: m.Reports })));
const HomepageSectionsList = lazy(() =>
  import("./pages/admin/homepage/HomepageSectionsList").then((m) => ({
    default: m.HomepageSectionsList,
  })),
);
const HomepageSectionForm = lazy(() =>
  import("./pages/admin/homepage/HomepageSectionForm").then((m) => ({
    default: m.HomepageSectionForm,
  })),
);
const Settings = lazy(() => import("./pages/admin/Settings").then((m) => ({ default: m.Settings })));
const AdminMore = lazy(() => import("./pages/admin/AdminMore").then((m) => ({ default: m.AdminMore })));
const AdminLayout = lazy(() =>
  import("./components/admin/AdminLayout").then((m) => ({ default: m.AdminLayout })),
);

function CustomerApp() {
  const bottomBarRef = useRef<HTMLDivElement>(null);
  useReportBottomBarHeight(bottomBarRef);
  const bottomBarHeight = useBottomBarHeight();
  const settings = useSiteSettings();
  const { whatsapp } = settings.status === "success" ? settings.data : SITE_SETTINGS_DEFAULTS;

  return (
    <div className="app-shell">
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      {/* Static fallback padding (className) covers the first paint before
          ResizeObserver reports a real height; the inline style then takes
          over with the exact measured value — including whenever the
          install banner appears/disappears, which the static estimate
          alone can never account for. */}
      <main
        id="main-content"
        className="flex-1 pb-[calc(5.25rem+env(safe-area-inset-bottom))]"
        style={bottomBarHeight > 0 ? { paddingBottom: bottomBarHeight } : undefined}
      >
        <PageTransition>
          {(location) => (
            <Routes location={location}>
              <Route path="/" element={<Home />} />
              <Route path="/products" element={<Products />} />
              <Route path="/products/:id" element={<ProductDetail />} />
              <Route path="/categories/:id" element={<CategoryDetail />} />
              <Route path="/search" element={<Search />} />
              <Route path="/saved" element={<Saved />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/enquire" element={<Enquire />} />
              <Route path="/request-purchase" element={<RequestPurchase />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          )}
        </PageTransition>
        <Footer />
      </main>
      {/* Rendered here — a sibling of <main>, outside PageTransition —
          rather than inside a page component. PageTransition's route
          animation applies a `transform` to its wrapper, and thanks to
          `animation-fill-mode: both` that transform value never fully
          clears afterwards, which creates a new containing block for any
          `position: fixed` descendant. A floating action button nested
          inside that wrapper would scroll away with the page instead of
          staying pinned to the viewport, so it lives out here, and shows
          on every route instead of only the homepage. */}
      <FloatingWhatsApp phone={whatsapp} />
      <div ref={bottomBarRef} className="fixed inset-x-0 bottom-0 z-30 mx-auto w-full max-w-app">
        <InstallAppBanner />
        <BottomNavigation />
      </div>
    </div>
  );
}

export function App() {
  useScrollRestoration();
  useManifestForRoute();

  return (
    <Suspense fallback={<LoadingState label="Loading…" />}>
      <Routes>
        <Route path="/admin/login" element={<Login />} />
        <Route
          path="/admin"
          element={<AdminLayout />}
        >
          <Route element={<ProtectedRoute />}>
            <Route index element={<Dashboard />} />
            <Route path="categories" element={<CategoriesList />} />
            <Route path="categories/new" element={<CategoryForm />} />
            <Route path="categories/:id/edit" element={<CategoryForm />} />
            <Route path="products" element={<ProductsList />} />
            <Route path="products/new" element={<ProductForm />} />
            <Route path="products/:id/edit" element={<ProductForm />} />
            <Route path="customers" element={<CustomersList />} />
            <Route path="customers/new" element={<CustomerForm />} />
            <Route path="customers/:id/edit" element={<CustomerForm />} />
            <Route path="rentals" element={<RentalsList />} />
            <Route path="rentals/new" element={<RentalForm />} />
            <Route path="enquiries" element={<EnquiriesList />} />
            <Route path="enquiries/:id" element={<EnquiryDetail />} />
            <Route path="purchase-requests" element={<PurchaseRequestsList />} />
            <Route path="purchase-requests/new" element={<PurchaseRequestForm />} />
            <Route path="purchase-requests/:id" element={<PurchaseRequestDetail />} />
            <Route path="reports" element={<Reports />} />
            <Route path="homepage" element={<HomepageSectionsList />} />
            <Route path="homepage/:sectionKey" element={<HomepageSectionForm />} />
            <Route path="settings" element={<Settings />} />
            <Route path="more" element={<AdminMore />} />
          </Route>
        </Route>
        <Route path="/*" element={<CustomerApp />} />
      </Routes>
    </Suspense>
  );
}
