export const OFFER_PRODUCTS = [
  { id: "phone", mark: "phone", price: 999, compareAt: 2499, rating: 4.8, reviews: 86 },
  { id: "console", mark: "console", price: 1649, compareAt: 2199, rating: 4.9, reviews: 54 },
  { id: "controller", mark: "controller", price: 249, compareAt: 349, rating: 4.7, reviews: 64 },
  { id: "earbuds", mark: "earbuds", price: 189, compareAt: 279, rating: 4.8, reviews: 51 },
  { id: "charger", mark: "charger", price: 79, compareAt: 149, rating: 4.6, reviews: 38 },
  { id: "case", mark: "case", price: 49, compareAt: 89, rating: 4.5, reviews: 27 },
  { id: "storage", mark: "storage", price: 349, compareAt: 499, rating: 4.9, reviews: 33 },
  { id: "screen", mark: "screen", price: 899, compareAt: 1299, rating: 4.7, reviews: 19 },
  { id: "dock", mark: "dock", price: 129, compareAt: 199, rating: 4.6, reviews: 22 },
  { id: "headset", mark: "headset", price: 279, compareAt: 399, rating: 4.8, reviews: 41 },
  { id: "phone-mini", mark: "phone", price: 1499, compareAt: 1999, rating: 4.7, reviews: 44 },
  { id: "game", mark: "console", price: 179, compareAt: 249, rating: 4.8, reviews: 61 },
  { id: "cable", mark: "charger", price: 35, compareAt: 59, rating: 4.6, reviews: 29 },
  { id: "power", mark: "dock", price: 99, compareAt: 159, rating: 4.7, reviews: 36 },
  { id: "speaker", mark: "earbuds", price: 159, compareAt: 229, rating: 4.5, reviews: 18 },
  { id: "bag", mark: "case", price: 89, compareAt: 139, rating: 4.6, reviews: 15 },
  { id: "screen-24", mark: "screen", price: 699, compareAt: 999, rating: 4.7, reviews: 21 },
  { id: "controller-extra", mark: "controller", price: 199, compareAt: 279, rating: 4.8, reviews: 40 },
  { id: "gaming-earbuds", mark: "earbuds", price: 229, compareAt: 319, rating: 4.8, reviews: 26 },
  { id: "drive-512", mark: "storage", price: 199, compareAt: 279, rating: 4.9, reviews: 31 },
] as const;

export type OfferProduct = {
  id: (typeof OFFER_PRODUCTS)[number]["id"];
  mark: (typeof OFFER_PRODUCTS)[number]["mark"];
  price: number;
  compareAt: number;
  rating: number;
  reviews: number;
};
