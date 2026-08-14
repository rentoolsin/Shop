import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import { BottomNavigation } from "./components/layout/BottomNavigation";
import { useScrollRestoration } from "./hooks/useScrollRestoration";
import { LoadingState } from "./components/ui/LoadingState";
import { Home } from "./pages/Home";
import { Products } from "./pages/Products";
import { ProductDetail } from "./pages/ProductDetail";
import { CategoryDetail } from "./pages/CategoryDetail";
import { Search } from "./pages/Search";
import { More } from "./pages/More";
import { About } from "./pages/About";
import { Contact } from "./pages/Contact";
import { Location } from "./pages/Location";
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
const AdminLayout = lazy(() =>
  import("./components/admin/AdminLayout").then((m) => ({ default: m.AdminLayout })),
);

function CustomerApp() {
  return (
    <div className="app-shell">
      <div className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<Products />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route path="/categories/:id" element={<CategoryDetail />} />
          <Route path="/search" element={<Search />} />
          <Route path="/more" element={<More />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/location" element={<Location />} />
          <Route path="/enquire" element={<Enquire />} />
          <Route path="/request-purchase" element={<RequestPurchase />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
      <BottomNavigation />
    </div>
  );
}

export function App() {
  useScrollRestoration();

  return (
    <Suspense fallback={<LoadingState label="Loading…" />}>
      <Routes>
        <Route path="/admin/login" element={<Login />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
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
        </Route>
        <Route path="/*" element={<CustomerApp />} />
      </Routes>
    </Suspense>
  );
}
