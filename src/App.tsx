import { useLayoutEffect, type ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { Redirect, Route, Switch, useLocation } from "wouter";
import { Toaster } from "@/components/ui/sonner";
import { LangProvider, type Lang } from "@/lib/i18n";
import { LANGS } from "@/lib/locale";
import { queryClient } from "@/lib/query";
import { CartProvider } from "@/lib/cart";
import { CustomerProvider } from "@/lib/customer";
import { FavoritesProvider } from "@/lib/favorites";
import { SiteContentProvider } from "@/lib/site-content";
import { AdminPage } from "@/pages/AdminPage";
import { ShopPage } from "@/pages/ShopPage";
import { StoreShopPage } from "@/pages/StoreShopPage";
import { HomePage } from "@/pages/HomePage";
import { CategoryPage } from "@/pages/CategoryPage";
import { CheckoutPage } from "@/pages/CheckoutPage";
import { OrderPage, TrackPage } from "@/pages/OrderPage";
import { FavoritesPage } from "@/pages/FavoritesPage";
import { OffersPage } from "@/pages/OffersPage";
import { SearchPage } from "@/pages/SearchPage";
import { AccountPage } from "@/pages/AccountPage";
import { AuthPage } from "@/pages/AuthPage";
import { CartPage } from "@/pages/CartPage";
import { ComparePage } from "@/pages/ComparePage";
import { ProductPage } from "@/pages/ProductPage";
import { WholesalePage } from "@/pages/WholesalePage";

function ScrollToTop() {
  const [location] = useLocation();

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  return null;
}

function withLang(lang: Lang, page: ReactNode) {
  return <LangProvider lang={lang}>{page}</LangProvider>;
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
          {LANGS.map((lang) => (
            <Route key={`${lang}-admin`} path={`/${lang}/admin`}>
              <AdminPage />
            </Route>
          ))}
          {LANGS.map((lang) => (
            <Route key={`${lang}-store-shop`} path={`/${lang}/shops/:id`}>
              {(params) => withLang(lang, <StoreShopPage id={decodeURIComponent(params.id)} />)}
            </Route>
          ))}
          {LANGS.map((lang) => (
            <Route key={`${lang}-shop`} path={`/${lang}/shop`}>
              <ShopPage />
            </Route>
          ))}
          {LANGS.map((lang) => (
            <Route key={`${lang}-offers`} path={`/${lang}/offers`}>
              {withLang(lang, <OffersPage />)}
            </Route>
          ))}
          {LANGS.map((lang) => (
            <Route key={`${lang}-login`} path={`/${lang}/login`}>
              {withLang(lang, <AuthPage />)}
            </Route>
          ))}
          {LANGS.map((lang) => (
            <Route key={`${lang}-account`} path={`/${lang}/account`}>
              {withLang(lang, <AccountPage />)}
            </Route>
          ))}
          {LANGS.map((lang) => (
            <Route key={`${lang}-search`} path={`/${lang}/search`}>
              {withLang(lang, <SearchPage />)}
            </Route>
          ))}
          {LANGS.map((lang) => (
            <Route key={`${lang}-favorites`} path={`/${lang}/favorites`}>
              {withLang(lang, <FavoritesPage />)}
            </Route>
          ))}
          {LANGS.map((lang) => (
            <Route key={`${lang}-checkout`} path={`/${lang}/checkout`}>
              {withLang(lang, <CheckoutPage />)}
            </Route>
          ))}
          {LANGS.map((lang) => (
            <Route key={`${lang}-track`} path={`/${lang}/track`}>
              {withLang(lang, <TrackPage />)}
            </Route>
          ))}
          {LANGS.map((lang) => (
            <Route key={`${lang}-order`} path={`/${lang}/order/:id`}>
              {(params) => withLang(lang, <OrderPage id={params.id} />)}
            </Route>
          ))}
          {LANGS.map((lang) => (
            <Route key={`${lang}-product`} path={`/${lang}/p/:id`}>
              {(params) => withLang(lang, <ProductPage id={params.id} />)}
            </Route>
          ))}
          {LANGS.map((lang) => (
            <Route key={`${lang}-wholesale`} path={`/${lang}/wholesale`}>
              {withLang(lang, <WholesalePage />)}
            </Route>
          ))}
          {LANGS.map((lang) => (
            <Route key={`${lang}-cart`} path={`/${lang}/cart`}>
              {withLang(lang, <CartPage />)}
            </Route>
          ))}
          {LANGS.map((lang) => (
            <Route key={`${lang}-compare`} path={`/${lang}/compare/:id`}>
              {(params) => withLang(lang, <ComparePage id={params.id} />)}
            </Route>
          ))}
          {LANGS.map((lang) => (
            <Route key={`${lang}-category`} path={`/${lang}/c/:id`}>
              {(params) => withLang(lang, <CategoryPage id={params.id} />)}
            </Route>
          ))}
          {LANGS.map((lang) => (
            <Route key={`${lang}-home`} path={`/${lang}`}>
              {withLang(lang, <HomePage />)}
            </Route>
          ))}
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
