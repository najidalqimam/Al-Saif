import { config } from "../config.js";
import type { Message } from "./transport.js";

// The registration confirmation sent to a new customer, in the language they registered in.

const escape = (text: string) => text.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);

export function welcomeMessage(to: string, firstName: string, locale: string): Message {
  const store = config.STORE_URL.replace(/\/$/, "");
  if (locale === "en") {
    const account = `${store}/en/account`;
    return {
      to,
      subject: "Your Al-Saif Store account is ready",
      text: `Hello ${firstName},\n\nYour account on Al-Saif Store was created successfully. You can sign in with your mobile number and password to follow your orders and keep your addresses.\n\nYour account: ${account}\n\nIf you did not create this account, reply to this email and let us know.\n\nAl-Saif Store`,
      html: `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.7;color:#111d32"><p>Hello ${escape(firstName)},</p><p>Your account on <strong>Al-Saif Store</strong> was created successfully. You can sign in with your mobile number and password to follow your orders and keep your addresses.</p><p><a href="${account}" style="display:inline-block;background:#2563eb;color:#fff;padding:10px 18px;border-radius:999px;text-decoration:none">Open my account</a></p><p style="color:#64748b;font-size:13px">If you did not create this account, reply to this email and let us know.</p><p>Al-Saif Store</p></div>`,
    };
  }
  const account = `${store}/ar/account`;
  return {
    to,
    subject: "تم إنشاء حسابك في متجر السيف",
    text: `أهلًا ${firstName}،\n\nتم إنشاء حسابك في متجر السيف بنجاح. تقدر تسجّل دخولك برقم جوالك وكلمة السر علشان تتابع طلباتك وتحفظ عناوينك.\n\nحسابك: ${account}\n\nإذا ما أنشأت هذا الحساب، رد على هذه الرسالة وبلغنا.\n\nمتجر السيف`,
    html: `<div dir="rtl" style="font-family:Tahoma,Arial,sans-serif;font-size:15px;line-height:1.9;color:#111d32;text-align:right"><p>أهلًا ${escape(firstName)}،</p><p>تم إنشاء حسابك في <strong>متجر السيف</strong> بنجاح. تقدر تسجّل دخولك برقم جوالك وكلمة السر علشان تتابع طلباتك وتحفظ عناوينك.</p><p><a href="${account}" style="display:inline-block;background:#2563eb;color:#fff;padding:10px 18px;border-radius:999px;text-decoration:none">افتح حسابي</a></p><p style="color:#64748b;font-size:13px">إذا ما أنشأت هذا الحساب، رد على هذه الرسالة وبلغنا.</p><p>متجر السيف</p></div>`,
  };
}
