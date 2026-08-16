import { lazy, Suspense, useRef } from "react";
import { useSwipeNavigation } from "./hooks/useSwipeNavigation";
import { Route, Routes } from "react-router-dom";
import { BottomNavigation } from "./components/layout/BottomNavigation";
import { InstallAppBanner } from "./components/layout/InstallAppBanner";
import { PageTransition } from "./components/layout/PageTransition";
import { Footer } from "./components/layout/Footer";
import { DesktopHeader } from "./components/layout/DesktopHeader";
import { FloatingWhatsApp } from "./components/actions/FloatingWhatsApp";
import { useScrollRestoration } from "./hooks/useScrollRestoration";
import { useManifestForRoute } from "./hooks/useManifestForRoute";
import { usePwaUpdate } from "./hooks/usePwaUpdate";
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
const LocationsList = lazy(() =>
  import("./pages/admin/locations/LocationsList").then((m) => ({ default: m.LocationsList })),
);
const LocationForm = lazy(() =>
  import("./pages/admin/locations/LocationForm").then((m) => ({ default: m.LocationForm })),
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

  // Android/iOS-style edge navigation: swipe right anywhere on the page to
  // go back, swipe left to go forward again — see useSwipeNavigation for
  // how it avoids fighting carousels/chip strips.
  const mainRef = useRef<HTMLElement>(null);
  useSwipeNavigation(mainRef);

  return (
    // The mobile 480px canvas cap (`.app-shell`, see index.css) is a
    // deliberate mobile-first decision — every route still gets it by
    // default below `md:`. Every route now also has an actual desktop
    // layout (see each page's `hidden md:block` section, and
    // `DesktopHeader`/`DesktopHome` for the pattern), so the cap is
    // lifted at `md:` unconditionally instead of only for Home.
    <div className="app-shell md:max-w-none">
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      {/* Persistent top bar for `md:` and up — replaces MobileHeader/
          PageHeader + BottomNavigation as the primary chrome once a
          desktop layout exists. Sits outside PageTransition/`<main>` so
          it never re-mounts or animates on route change. */}
      <div className="hidden md:block">
        <DesktopHeader />
      </div>
      {/* Static fallback padding (className) covers the first paint before
          ResizeObserver reports a real height; the inline style then takes
          over with the exact measured value — including whenever the
          install banner appears/disappears, which the static estimate
          alone can never account for. Padding only matters for the mobile
          bottom nav, so it's zeroed out again at `md:`. */}
      <main
        id="main-content"
        ref={mainRef}
        className="flex-1 pb-[calc(5.25rem+env(safe-area-inset-bottom))] md:pb-0"
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
          on every route instead of only the homepage.
          Both the floating chat bubble and the bottom tab bar read as
          mobile chrome next to the desktop header/layout, so both are
          hidden at `md:` and up, on every route. */}
      <div className="md:hidden">
        <FloatingWhatsApp phone={whatsapp} />
      </div>
      <div
        ref={bottomBarRef}
        className="fixed inset-x-0 bottom-0 z-30 mx-auto w-full max-w-app md:hidden"
      >
        <InstallAppBanner />
        <BottomNavigation />
      </div>
    </div>
  );
}

export function App() {
  useScrollRestoration();
  useManifestForRoute();
  usePwaUpdate();

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
            <Route path="locations" element={<LocationsList />} />
            <Route path="locations/new" element={<LocationForm />} />
            <Route path="locations/:id/edit" element={<LocationForm />} />
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
