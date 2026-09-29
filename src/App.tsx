import { useLayoutEffect } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { Redirect, Route, Switch, useLocation } from "wouter";
import { Toaster } from "@/components/ui/sonner";
import { LangProvider, type Lang } from "@/lib/i18n";
import { queryClient } from "@/lib/query";
import { CartProvider } from "@/lib/cart";
import { SiteContentProvider } from "@/lib/site-content";
import { AdminPage } from "@/pages/AdminPage";
import { HomePage } from "@/pages/HomePage";
import { CategoryPage } from "@/pages/CategoryPage";
import { OffersPage } from "@/pages/OffersPage";

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
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
        <ScrollToTop />
        <SiteContentProvider>
        <CartProvider>
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
        </CartProvider>
        </SiteContentProvider>
        <Toaster />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
