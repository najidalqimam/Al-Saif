import type { Lang } from "@/lib/i18n";

// Copy for the sign-in, registration and account pages.
export const ACCOUNT_COPY: Record<
  Lang,
  {
    signIn: string;
    register: string;
    signInTitle: string;
    signInLead: string;
    registerTitle: string;
    registerLead: string;
    firstName: string;
    lastName: string;
    phone: string;
    phoneHint: string;
    loginId: string;
    loginIdHint: string;
    email: string;
    password: string;
    passwordHint: string;
    showPassword: string;
    hidePassword: string;
    signInAction: string;
    registerAction: string;
    noAccount: string;
    haveAccount: string;
    guestNote: string;
    working: string;
    myAccount: string;
    hello: (name: string) => string;
    signOut: string;
    tabs: { orders: string; addresses: string; profile: string; password: string };
    noOrders: string;
    browse: string;
    placedOn: string;
    items: string;
    total: string;
    deliverTo: string;
    orderStatus: Record<"NEW" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED", string>;
    paymentStatus: Record<"PENDING" | "PAID" | "FAILED" | "REFUNDED", string>;
    paymentMethod: Record<"COD" | "BANK_TRANSFER" | "ONLINE", string>;
    addresses: string;
    addAddress: string;
    editAddress: string;
    noAddresses: string;
    label: string;
    labelHint: string;
    zone: string;
    chooseZone: string;
    city: string;
    street: string;
    streetHint: string;
    notes: string;
    optional: string;
    makeDefault: string;
    isDefault: string;
    setDefault: string;
    edit: string;
    remove: string;
    removeConfirm: string;
    save: string;
    cancel: string;
    saved: string;
    profile: string;
    avatar: string;
    avatarLead: string;
    noAvatar: string;
    changeAvatar: string;
    phoneLocked: string;
    welcomeSent: string;
    welcomePending: string;
    welcomeFailed: string;
    resend: string;
    currentPassword: string;
    newPassword: string;
    changePassword: string;
    passwordChanged: string;
    errors: Record<string, string>;
  }
> = {
  ar: {
    signIn: "تسجيل الدخول",
    register: "حساب جديد",
    signInTitle: "تسجيل الدخول",
    signInLead: "ادخل برقم جوالك أو بريدك الإلكتروني، وكلمة السر.",
    registerTitle: "إنشاء حساب",
    registerLead: "سجّل مرة وحدة، وتابع طلباتك واحفظ عناوينك.",
    firstName: "الاسم الأول",
    lastName: "اسم العائلة",
    phone: "رقم الجوال",
    phoneHint: "مثال: 0512345678",
    loginId: "رقم الجوال أو البريد الإلكتروني",
    loginIdHint: "0512345678 أو name@example.com",
    email: "البريد الإلكتروني",
    password: "كلمة السر",
    passwordHint: "8 أحرف على الأقل.",
    showPassword: "إظهار كلمة السر",
    hidePassword: "إخفاء كلمة السر",
    signInAction: "دخول",
    registerAction: "إنشاء الحساب",
    noAccount: "ما عندك حساب؟",
    haveAccount: "عندك حساب؟",
    guestNote: "تقدر تكمل الطلب بدون حساب من صفحة إتمام الطلب.",
    working: "لحظة…",
    myAccount: "حسابي",
    hello: (name) => `أهلًا ${name}`,
    signOut: "تسجيل الخروج",
    tabs: { orders: "طلباتي", addresses: "عناويني", profile: "بياناتي", password: "كلمة السر" },
    noOrders: "ما عندك طلبات لسه.",
    browse: "تصفح المنتجات",
    placedOn: "تاريخ الطلب",
    items: "المنتجات",
    total: "الإجمالي",
    deliverTo: "التوصيل إلى",
    orderStatus: { NEW: "تم الاستلام", PROCESSING: "قيد التجهيز", SHIPPED: "تم الشحن", DELIVERED: "تم التسليم", CANCELLED: "ملغي" },
    paymentStatus: { PENDING: "بانتظار الدفع", PAID: "مدفوع", FAILED: "فشل الدفع", REFUNDED: "مسترجع" },
    paymentMethod: { COD: "الدفع عند الاستلام", BANK_TRANSFER: "تحويل بنكي", ONLINE: "دفع إلكتروني" },
    addresses: "العناوين المحفوظة",
    addAddress: "إضافة عنوان",
    editAddress: "تعديل العنوان",
    noAddresses: "ما فيه عناوين محفوظة. أضف عنوان علشان يتعبى تلقائيًا وقت الطلب.",
    label: "اسم العنوان",
    labelHint: "مثال: البيت، العمل",
    zone: "المنطقة",
    chooseZone: "اختر المنطقة",
    city: "المدينة",
    street: "الحي والشارع",
    streetHint: "الحي، الشارع، رقم المبنى",
    notes: "ملاحظات للمندوب",
    optional: "اختياري",
    makeDefault: "اجعله العنوان الأساسي",
    isDefault: "العنوان الأساسي",
    setDefault: "اجعله أساسي",
    edit: "تعديل",
    remove: "حذف",
    removeConfirm: "تأكيد الحذف",
    save: "حفظ",
    cancel: "إلغاء",
    saved: "تم الحفظ",
    profile: "بيانات الحساب",
    avatar: "الصورة الرمزية",
    avatarLead: "اختر الشكل اللي يظهر جنب اسمك.",
    noAvatar: "بدون",
    changeAvatar: "تغيير الصورة الرمزية",
    phoneLocked: "رقم الجوال هو اسم الدخول، وما يتغير من هنا.",
    welcomeSent: "أرسلنا رسالة تأكيد إنشاء الحساب إلى بريدك.",
    welcomePending: "رسالة تأكيد إنشاء الحساب في الطريق لبريدك.",
    welcomeFailed: "ما قدرنا نرسل رسالة التأكيد لبريدك.",
    resend: "أرسلها مرة ثانية",
    currentPassword: "كلمة السر الحالية",
    newPassword: "كلمة السر الجديدة",
    changePassword: "تغيير كلمة السر",
    passwordChanged: "تم تغيير كلمة السر، وسجّلنا خروجك من الأجهزة الثانية.",
    errors: {
      INVALID_CREDENTIALS: "بيانات الدخول أو كلمة السر غير صحيحة.",
      PHONE_TAKEN: "رقم الجوال مسجّل في حساب ثاني. سجّل دخولك بدلًا من ذلك.",
      EMAIL_TAKEN: "البريد الإلكتروني مسجّل في حساب ثاني.",
      TOO_MANY_ATTEMPTS: "محاولات كثيرة. انتظر شوي وحاول مرة ثانية.",
      WRONG_PASSWORD: "كلمة السر الحالية غير صحيحة.",
      ALREADY_SENT: "رسالة التأكيد وصلت بريدك من قبل.",
      ZONE_UNAVAILABLE: "ما نوصل لهذي المنطقة حاليًا.",
      NETWORK: "ما قدرنا نوصل للخادم. تأكد من الاتصال وحاول مرة ثانية.",
      required: "هذا الحقل مطلوب.",
      badPhone: "اكتب رقم جوال سعودي يبدأ بـ 05 ومكوّن من 10 أرقام.",
      badLogin: "اكتب رقم جوال يبدأ بـ 05 (10 أرقام) أو بريد إلكتروني صحيح.",
      badEmail: "البريد الإلكتروني غير صحيح.",
      badName: "اكتب الاسم بالحروف فقط.",
      shortPassword: "كلمة السر لازم تكون 8 أحرف على الأقل.",
      generic: "صار خطأ. حاول مرة ثانية.",
    },
  },
  en: {
    signIn: "Sign in",
    register: "Create account",
    signInTitle: "Sign in",
    signInLead: "Use your mobile number or email, and your password.",
    registerTitle: "Create an account",
    registerLead: "Register once to follow your orders and keep your addresses.",
    firstName: "First name",
    lastName: "Last name",
    phone: "Mobile number",
    phoneHint: "e.g. 0512345678",
    loginId: "Mobile number or email",
    loginIdHint: "0512345678 or name@example.com",
    email: "Email",
    password: "Password",
    passwordHint: "At least 8 characters.",
    showPassword: "Show password",
    hidePassword: "Hide password",
    signInAction: "Sign in",
    registerAction: "Create account",
    noAccount: "No account yet?",
    haveAccount: "Already registered?",
    guestNote: "You can also check out as a guest from the checkout page.",
    working: "One moment…",
    myAccount: "My account",
    hello: (name) => `Hello ${name}`,
    signOut: "Sign out",
    tabs: { orders: "My orders", addresses: "Addresses", profile: "Profile", password: "Password" },
    noOrders: "You have no orders yet.",
    browse: "Browse products",
    placedOn: "Ordered on",
    items: "Items",
    total: "Total",
    deliverTo: "Deliver to",
    orderStatus: { NEW: "Received", PROCESSING: "Being prepared", SHIPPED: "Shipped", DELIVERED: "Delivered", CANCELLED: "Cancelled" },
    paymentStatus: { PENDING: "Awaiting payment", PAID: "Paid", FAILED: "Payment failed", REFUNDED: "Refunded" },
    paymentMethod: { COD: "Cash on delivery", BANK_TRANSFER: "Bank transfer", ONLINE: "Online payment" },
    addresses: "Saved addresses",
    addAddress: "Add address",
    editAddress: "Edit address",
    noAddresses: "No saved addresses. Add one and it fills in automatically at checkout.",
    label: "Address name",
    labelHint: "e.g. Home, Work",
    zone: "Region",
    chooseZone: "Choose a region",
    city: "City",
    street: "District and street",
    streetHint: "District, street, building number",
    notes: "Notes for the courier",
    optional: "optional",
    makeDefault: "Make this my main address",
    isDefault: "Main address",
    setDefault: "Make main",
    edit: "Edit",
    remove: "Delete",
    removeConfirm: "Confirm delete",
    save: "Save",
    cancel: "Cancel",
    saved: "Saved",
    profile: "Account details",
    avatar: "Avatar",
    avatarLead: "Pick what shows next to your name.",
    noAvatar: "None",
    changeAvatar: "Change avatar",
    phoneLocked: "Your mobile number is your sign-in name and can't be changed here.",
    welcomeSent: "We sent an account confirmation to your email.",
    welcomePending: "Your account confirmation email is on its way.",
    welcomeFailed: "We couldn't send the confirmation to your email.",
    resend: "Send it again",
    currentPassword: "Current password",
    newPassword: "New password",
    changePassword: "Change password",
    passwordChanged: "Password changed. Other devices were signed out.",
    errors: {
      INVALID_CREDENTIALS: "Wrong mobile number, email or password.",
      PHONE_TAKEN: "This mobile number already has an account. Sign in instead.",
      EMAIL_TAKEN: "This email already has an account.",
      TOO_MANY_ATTEMPTS: "Too many attempts. Wait a little and try again.",
      WRONG_PASSWORD: "The current password is not correct.",
      ALREADY_SENT: "The confirmation email was already delivered.",
      ZONE_UNAVAILABLE: "We don't deliver to this region right now.",
      NETWORK: "We couldn't reach the server. Check your connection and try again.",
      required: "This field is required.",
      badPhone: "Enter a Saudi mobile number: 10 digits starting with 05.",
      badLogin: "Enter a mobile number starting with 05 (10 digits) or a valid email.",
      badEmail: "This email address is not valid.",
      badName: "Use letters only.",
      shortPassword: "The password needs at least 8 characters.",
      generic: "Something went wrong. Please try again.",
    },
  },
};
