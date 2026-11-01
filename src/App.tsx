import { useLayoutEffect } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { Redirect, Route, Switch, useLocation } from "wouter";
import { Toaster } from "@/components/ui/sonner";
import { LangProvider, type Lang } from "@/lib/i18n";
import { queryClient } from "@/lib/query";
import { CartProvider } from "@/lib/cart";
import { CustomerProvider } from "@/lib/customer";
import { FavoritesProvider } from "@/lib/favorites";
import { SiteContentProvider } from "@/lib/site-content";
import { AdminPage } from "@/pages/AdminPage";
import { HomePage } from "@/pages/HomePage";
import { CategoryPage } from "@/pages/CategoryPage";
import { CheckoutPage } from "@/pages/CheckoutPage";
import { OrderPage, TrackPage } from "@/pages/OrderPage";
import { FavoritesPage } from "@/pages/FavoritesPage";
import { OffersPage } from "@/pages/OffersPage";
import { SearchPage } from "@/pages/SearchPage";
import { AccountPage } from "@/pages/AccountPage";
import { AuthPage } from "@/pages/AuthPage";
import { ProductPage } from "@/pages/ProductPage";

function ScrollToTop() {
  const [location] = useLocation();

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  return null;
}

function LangShell({ lang }: { lang: Lang }) {
  return (
    <LangProvider lang={lang}>
      <HomePage />
    </LangProvider>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="dark" storageKey="al-saif-theme" enableSystem={false} enableColorScheme={false} disableTransitionOnChange>
        <ScrollToTop />
        <SiteContentProvider>
        <CustomerProvider>
        <CartProvider>
        <FavoritesProvider>
        <Switch>
          <Route path="/">
            <Redirect to="/ar" />
          </Route>
          <Route path="/ar/admin">
            <AdminPage />
          </Route>
          <Route path="/en/admin">
            <AdminPage />
          </Route>
          <Route path="/ar/offers">
            <LangProvider lang="ar">
              <OffersPage />
            </LangProvider>
          </Route>
          <Route path="/en/offers">
            <LangProvider lang="en">
              <OffersPage />
            </LangProvider>
          </Route>
          <Route path="/ar/login">
            <LangProvider lang="ar">
              <AuthPage />
            </LangProvider>
          </Route>
          <Route path="/ar/account">
            <LangProvider lang="ar">
              <AccountPage />
            </LangProvider>
          </Route>
          <Route path="/en/login">
            <LangProvider lang="en">
              <AuthPage />
            </LangProvider>
          </Route>
          <Route path="/en/account">
            <LangProvider lang="en">
              <AccountPage />
            </LangProvider>
          </Route>
          <Route path="/ar/search">
            <LangProvider lang="ar">
              <SearchPage />
            </LangProvider>
          </Route>
          <Route path="/en/search">
            <LangProvider lang="en">
              <SearchPage />
            </LangProvider>
          </Route>
          <Route path="/ar/favorites">
            <LangProvider lang="ar">
              <FavoritesPage />
            </LangProvider>
          </Route>
          <Route path="/en/favorites">
            <LangProvider lang="en">
              <FavoritesPage />
            </LangProvider>
          </Route>
          <Route path="/ar/checkout">
            <LangProvider lang="ar">
              <CheckoutPage />
            </LangProvider>
          </Route>
          <Route path="/ar/track">
            <LangProvider lang="ar">
              <TrackPage />
            </LangProvider>
          </Route>
          <Route path="/ar/order/:id">
            {(params) => (
              <LangProvider lang="ar">
                <OrderPage id={params.id} />
              </LangProvider>
            )}
          </Route>
          <Route path="/en/checkout">
            <LangProvider lang="en">
              <CheckoutPage />
            </LangProvider>
          </Route>
          <Route path="/en/track">
            <LangProvider lang="en">
              <TrackPage />
            </LangProvider>
          </Route>
          <Route path="/en/order/:id">
            {(params) => (
              <LangProvider lang="en">
                <OrderPage id={params.id} />
              </LangProvider>
            )}
          </Route>
          <Route path="/ar/p/:id">
            {(params) => (
              <LangProvider lang="ar">
                <ProductPage id={params.id} />
              </LangProvider>
            )}
          </Route>
          <Route path="/en/p/:id">
            {(params) => (
              <LangProvider lang="en">
                <ProductPage id={params.id} />
              </LangProvider>
            )}
          </Route>
          <Route path="/ar/c/:id">
            {(params) => (
              <LangProvider lang="ar">
                <CategoryPage id={params.id} />
              </LangProvider>
            )}
          </Route>
          <Route path="/en/c/:id">
            {(params) => (
              <LangProvider lang="en">
                <CategoryPage id={params.id} />
              </LangProvider>
            )}
          </Route>
          <Route path="/ar">
            <LangShell lang="ar" />
          </Route>
          <Route path="/en">
            <LangShell lang="en" />
          </Route>
          <Route>
            <Redirect to="/ar" />
          </Route>
        </Switch>
        </FavoritesProvider>
        </CartProvider>
        </CustomerProvider>
        </SiteContentProvider>
        <Toaster />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
