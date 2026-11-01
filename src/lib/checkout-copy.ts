import type { Lang } from "@/lib/i18n";
import type { OrderStatus } from "@/lib/orders-store";

// Copy for the checkout, order confirmation and order tracking pages.
export const CHECKOUT_COPY: Record<
  Lang,
  {
    checkout: string;
    checkoutLead: string;
    emptyCart: string;
    backToStore: string;
    customer: string;
    name: string;
    phone: string;
    phoneHint: string;
    email: string;
    optional: string;
    address: string;
    zone: string;
    chooseZone: string;
    city: string;
    street: string;
    streetHint: string;
    notes: string;
    shipping: string;
    noShipping: string;
    free: string;
    days: (min: number, max: number) => string;
    sameDay: string;
    freeOver: (amount: string) => string;
    minOrder: (amount: string) => string;
    payment: string;
    noPayment: string;
    cod: string;
    codLead: string;
    bank: string;
    bankLead: string;
    online: string;
    onlineLead: string;
    unavailable: string;
    extraFee: (amount: string) => string;
    summary: string;
    subtotal: string;
    shippingFee: string;
    paymentFee: string;
    total: string;
    placeOrder: string;
    placeNote: string;
    required: string;
    badPhone: string;
    badEmail: string;
    pickShipping: string;
    pickPayment: string;
    thanks: string;
    thanksLead: string;
    orderNumber: string;
    status: string;
    statuses: Record<OrderStatus, string>;
    cancelledNote: string;
    deliverTo: string;
    paidWith: string;
    shippedWith: string;
    bankNext: string;
    codNext: string;
    items: string;
    keepShopping: string;
    track: string;
    trackLead: string;
    orderNo: string;
    findOrder: string;
    notFound: string;
    orderMissing: string;
    paymentStatus: Record<"pending" | "paid" | "failed" | "refunded", string>;
    localNote: string;
    updated: string;
    optionsError: string;
    retry: string;
    haveAccount: string;
    signInToFill: string;
    newAddress: string;
    saveAddress: string;
    orderErrors: Record<string, string>;
    accountTrack: string;
    guestTrack: string;
    createAccount: string;
    viewOrders: string;
    bankDetails: string;
    bankName: string;
    bankHolder: string;
  }
> = {
  ar: {
    checkout: "إتمام الطلب",
    checkoutLead: "أكمل بياناتك واختر طريقة الشحن والدفع. ما تحتاج حساب.",
    emptyCart: "سلتك فاضية. أضف منتجات وارجع هنا لإتمام الطلب.",
    backToStore: "الرجوع للمتجر",
    customer: "بياناتك",
    name: "الاسم الكامل",
    phone: "رقم الجوال",
    phoneHint: "مثال: 0512345678",
    email: "البريد الإلكتروني",
    optional: "اختياري",
    address: "عنوان التوصيل",
    zone: "المنطقة",
    chooseZone: "اختر المنطقة",
    city: "المدينة",
    street: "الحي والشارع",
    streetHint: "الحي، الشارع، رقم المبنى",
    notes: "ملاحظات للطلب",
    shipping: "طريقة الشحن",
    noShipping: "ما فيه طريقة شحن متاحة لهذي المنطقة أو لقيمة السلة الحالية.",
    free: "مجاني",
    days: (min, max) => (min === 0 ? `خلال ${max} ${max === 1 ? "يوم" : "أيام"}` : `${min}–${max} أيام`),
    sameDay: "نفس اليوم",
    freeOver: (amount) => `مجاني للطلبات فوق ${amount}`,
    minOrder: (amount) => `أقل مبلغ للطلب ${amount}`,
    payment: "طريقة الدفع",
    noPayment: "ما فيه طريقة دفع متاحة حاليًا.",
    cod: "الدفع عند الاستلام",
    codLead: "ادفع نقدًا أو بالشبكة لمندوب التوصيل.",
    bank: "تحويل بنكي",
    bankLead: "حوّل المبلغ، ونشحن طلبك بعد ما نتأكد من التحويل.",
    online: "الدفع الإلكتروني",
    onlineLead: "مدى وفيزا وأبل باي.",
    unavailable: "غير متاح حاليًا",
    extraFee: (amount) => `رسوم إضافية ${amount}`,
    summary: "ملخص الطلب",
    subtotal: "المنتجات",
    shippingFee: "الشحن",
    paymentFee: "رسوم الدفع",
    total: "الإجمالي",
    placeOrder: "تأكيد الطلب",
    placeNote: "بالضغط على تأكيد الطلب توافق على شروط البيع والاسترجاع.",
    required: "هذا الحقل مطلوب.",
    badPhone: "اكتب رقم جوال سعودي يبدأ بـ 05 ومكوّن من 10 أرقام.",
    badEmail: "البريد الإلكتروني غير صحيح.",
    pickShipping: "اختر طريقة الشحن.",
    pickPayment: "اختر طريقة الدفع.",
    thanks: "تم استلام طلبك",
    thanksLead: "شكرًا لك. بنتواصل معك على الجوال لتأكيد الطلب.",
    orderNumber: "رقم الطلب",
    status: "حالة الطلب",
    statuses: { new: "تم الاستلام", processing: "قيد التجهيز", shipped: "تم الشحن", delivered: "تم التسليم", cancelled: "ملغي" },
    cancelledNote: "تم إلغاء هذا الطلب. لو عندك سؤال تواصل معنا.",
    deliverTo: "التوصيل إلى",
    paidWith: "الدفع",
    shippedWith: "الشحن",
    bankNext: "تفاصيل الحساب البنكي توصلك مع رسالة تأكيد الطلب. نشحن الطلب بعد ما نتأكد من وصول التحويل.",
    codNext: "جهّز المبلغ عند الاستلام. تقدر تدفع نقدًا أو بالشبكة.",
    items: "المنتجات",
    keepShopping: "متابعة التسوق",
    track: "تتبع الطلب",
    trackLead: "اكتب رقم الطلب ورقم الجوال اللي طلبت فيه.",
    orderNo: "رقم الطلب",
    findOrder: "عرض الطلب",
    notFound: "ما لقينا طلب بهذا الرقم والجوال. تأكد من البيانات وجرّب مرة ثانية.",
    orderMissing: "ما لقينا هذا الطلب.",
    paymentStatus: { pending: "بانتظار الدفع", paid: "مدفوع", failed: "فشل الدفع", refunded: "مسترجع" },
    localNote: "طلبك يتحفظ عندنا مباشرة، والأسعار والرسوم تتحسب من جديد عند التأكيد. ما فيه دفع إلكتروني حاليًا.",
    updated: "تم تحديث حالة طلبك",
    optionsError: "ما قدرنا نجيب خيارات الشحن والدفع. تأكد من الاتصال وحاول مرة ثانية.",
    retry: "حاول مرة ثانية",
    haveAccount: "عندك حساب؟",
    signInToFill: "سجّل دخولك علشان نعبي بياناتك وعناوينك تلقائيًا",
    newAddress: "عنوان جديد",
    saveAddress: "احفظ هذا العنوان في حسابي",
    orderErrors: {
      OUT_OF_STOCK: "أحد المنتجات خلصت كميته. عدّل السلة وحاول مرة ثانية.",
      PRODUCT_UNAVAILABLE: "أحد المنتجات ما عاد متاح. عدّل السلة وحاول مرة ثانية.",
      ZONE_UNAVAILABLE: "ما نوصل لهذي المنطقة حاليًا.",
      SHIPPING_UNAVAILABLE: "طريقة الشحن ما عادت متاحة لهذي المنطقة. اختر طريقة ثانية.",
      BELOW_MINIMUM: "قيمة السلة أقل من الحد الأدنى لطريقة الشحن هذي.",
      PAYMENT_UNAVAILABLE: "طريقة الدفع ما عادت متاحة. اختر طريقة ثانية.",
      TOO_MANY_REQUESTS: "طلبات كثيرة خلال وقت قصير. انتظر شوي وحاول مرة ثانية.",
      INVALID_ORDER: "بعض البيانات غير صحيحة. راجع الحقول وحاول مرة ثانية.",
      NETWORK: "ما قدرنا نوصل للخادم. تأكد من الاتصال وحاول مرة ثانية.",
      generic: "ما قدرنا نكمل الطلب. حاول مرة ثانية.",
    },
    accountTrack: "تقدر تتابع حالة الطلب من صفحة حسابك.",
    guestTrack: "بنتواصل معك على الجوال بخصوص الطلب. سجّل حساب علشان تتابع طلباتك الجاية من مكان واحد.",
    createAccount: "إنشاء حساب",
    viewOrders: "طلباتي",
    bankDetails: "بيانات التحويل",
    bankName: "البنك",
    bankHolder: "اسم صاحب الحساب",
  },
  en: {
    checkout: "Checkout",
    checkoutLead: "Fill in your details and pick shipping and payment. No account needed.",
    emptyCart: "Your cart is empty. Add products and come back to check out.",
    backToStore: "Back to the store",
    customer: "Your details",
    name: "Full name",
    phone: "Mobile number",
    phoneHint: "e.g. 0512345678",
    email: "Email",
    optional: "optional",
    address: "Delivery address",
    zone: "Region",
    chooseZone: "Choose a region",
    city: "City",
    street: "District and street",
    streetHint: "District, street, building number",
    notes: "Order notes",
    shipping: "Shipping method",
    noShipping: "No shipping method is available for this region or cart total.",
    free: "Free",
    days: (min, max) => (min === 0 ? `Within ${max} ${max === 1 ? "day" : "days"}` : `${min}–${max} days`),
    sameDay: "Same day",
    freeOver: (amount) => `Free on orders over ${amount}`,
    minOrder: (amount) => `Minimum order ${amount}`,
    payment: "Payment method",
    noPayment: "No payment method is available right now.",
    cod: "Cash on delivery",
    codLead: "Pay the courier in cash or by card.",
    bank: "Bank transfer",
    bankLead: "Transfer the amount; we ship once the transfer is confirmed.",
    online: "Online payment",
    onlineLead: "Mada, Visa and Apple Pay.",
    unavailable: "Not available yet",
    extraFee: (amount) => `Extra fee ${amount}`,
    summary: "Order summary",
    subtotal: "Products",
    shippingFee: "Shipping",
    paymentFee: "Payment fee",
    total: "Total",
    placeOrder: "Place order",
    placeNote: "By placing the order you accept the sale and return terms.",
    required: "This field is required.",
    badPhone: "Enter a Saudi mobile number starting with 05, 10 digits long.",
    badEmail: "This email doesn't look right.",
    pickShipping: "Choose a shipping method.",
    pickPayment: "Choose a payment method.",
    thanks: "We received your order",
    thanksLead: "Thank you. We'll call your mobile to confirm the order.",
    orderNumber: "Order number",
    status: "Order status",
    statuses: { new: "Received", processing: "Preparing", shipped: "Shipped", delivered: "Delivered", cancelled: "Cancelled" },
    cancelledNote: "This order was cancelled. Contact us if you have a question.",
    deliverTo: "Deliver to",
    paidWith: "Payment",
    shippedWith: "Shipping",
    bankNext: "The bank account details come with the order confirmation message. We ship once the transfer arrives.",
    codNext: "Have the amount ready on delivery. Cash or card both work.",
    items: "Products",
    keepShopping: "Keep shopping",
    track: "Track an order",
    trackLead: "Enter the order number and the mobile number you ordered with.",
    orderNo: "Order number",
    findOrder: "Show order",
    notFound: "We couldn't find an order with that number and mobile. Check them and try again.",
    orderMissing: "We couldn't find this order.",
    paymentStatus: { pending: "Awaiting payment", paid: "Paid", failed: "Payment failed", refunded: "Refunded" },
    localNote: "Your order is saved with us right away, and prices and fees are checked again on confirmation. No online payment yet.",
    updated: "Your order status was updated",
    optionsError: "We couldn't load shipping and payment options. Check your connection and try again.",
    retry: "Try again",
    haveAccount: "Have an account?",
    signInToFill: "Sign in to fill in your details and addresses",
    newAddress: "New address",
    saveAddress: "Save this address to my account",
    orderErrors: {
      OUT_OF_STOCK: "One of the products is out of stock. Update your cart and try again.",
      PRODUCT_UNAVAILABLE: "One of the products is no longer available. Update your cart and try again.",
      ZONE_UNAVAILABLE: "We don't deliver to this region right now.",
      SHIPPING_UNAVAILABLE: "This shipping method is no longer available here. Pick another one.",
      BELOW_MINIMUM: "Your cart is below the minimum for this shipping method.",
      PAYMENT_UNAVAILABLE: "This payment method is no longer available. Pick another one.",
      TOO_MANY_REQUESTS: "Too many orders in a short time. Wait a little and try again.",
      INVALID_ORDER: "Some details are not valid. Check the fields and try again.",
      NETWORK: "We couldn't reach the server. Check your connection and try again.",
      generic: "We couldn't place the order. Please try again.",
    },
    accountTrack: "You can follow the order from your account.",
    guestTrack: "We will contact you by phone about the order. Create an account to follow your next orders in one place.",
    createAccount: "Create an account",
    viewOrders: "My orders",
    bankDetails: "Transfer details",
    bankName: "Bank",
    bankHolder: "Account holder",
  },
};
