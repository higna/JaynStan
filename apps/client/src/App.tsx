import { useEffect } from "react";
import { Route, Routes, useLocation } from "react-router";
import { HomePage, AboutPage } from "./pages/Index";
import { ServicesPage } from "./pages/Content";
import ContactPage from "./pages/Content/ContactPage";
import { NavBar, Footer } from "./components/Bar";
import { useTheme } from "./context/ThemeContext";
import { ThemeProvider } from "./context/ThemeContext";
import LoginPage from "./pages/Auth/LoginPage";
import GoogleCallbackPage from "./pages/Auth/GoogleCallbackPage";
import DashboardLayout from "./pages/Dashboard/DashboardLayout";
import DashboardHome from "./pages/Dashboard/DashboardHome";
import ProviderApplicationPage from "./pages/Dashboard/ProviderApplicationPage";
import AdminProviderApplicationsPage from "./pages/Dashboard/AdminProviderApplicationsPage";
import VerifyEmailPage from "./pages/Auth/VerifyEmailPage";
import ForgotPasswordPage from "./pages/Auth/ForgotPasswordPage";
import ResetPasswordPage from "./pages/Auth/ResetPasswordPage";
import SupportWidget from "./components/SupportWidget";
import AdminFeaturedWorksPage from "./pages/Dashboard/AdminFeaturedWorksPage";
import AdminAccountsPage from "./pages/Dashboard/AdminAccountsPage";
import AdminUsersPage from "./pages/Dashboard/AdminUsersPage";
import AdminSocialLinksPage from "./pages/Dashboard/AdminSocialLinksPage";
import AdminHomepageStatsPage from "./pages/Dashboard/AdminHomepageStatsPage";
import TermsPage from "./pages/Index/TermsPage";
import MyWorkPage from "./pages/Dashboard/MyWorkPage";
import ProfilePage from "./pages/Dashboard/ProfilePage";
import AdminSupportTicketsPage from "./pages/Dashboard/AdminSupportTicketsPage";

const AppLayout = () => {
  const { theme } = useTheme();
  const location = useLocation();
  const isWorkspace = location.pathname.startsWith("/dashboard");
  const isAuthPage = ["/login", "/auth/google/callback", "/verify-email", "/forgot-password", "/reset-password"].includes(location.pathname);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  return (
    <>
    <div className="min-h-screen">
      <div className="flex-1 flex flex-col">
        {!isWorkspace && !isAuthPage && <NavBar />}
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/services" element={<ServicesPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/auth/google/callback" element={<GoogleCallbackPage />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/dashboard" element={<DashboardLayout />}>
              <Route index element={<DashboardHome />} />
              <Route path="provider-application" element={<ProviderApplicationPage />} />
              <Route path="my-work" element={<MyWorkPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="admin/provider-applications" element={<AdminProviderApplicationsPage />} />
              <Route path="admin/support-tickets" element={<AdminSupportTicketsPage />} />
              <Route path="admin/featured-works" element={<AdminFeaturedWorksPage />} />
              <Route path="admin/accounts" element={<AdminAccountsPage />} />
              <Route path="admin/users" element={<AdminUsersPage />} />
              <Route path="admin/site-links" element={<AdminSocialLinksPage />} />
              <Route path="admin/homepage-stats" element={<AdminHomepageStatsPage />} />
            </Route>
          </Routes>
        </main>
        {!isWorkspace && !isAuthPage && <Footer />}
      </div>
    </div>
    <SupportWidget />
    </>
  );
};

const App = () => {
  return (
    <ThemeProvider>
      <AppLayout />
    </ThemeProvider>
  );
};

export default App;
