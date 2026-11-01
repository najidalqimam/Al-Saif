import { useState } from "react";
import { useTheme } from "next-themes";
import { Database, KeyRound, Moon, Palette, Phone, RotateCcw, Store, Truck } from "lucide-react";
import { useSiteContent } from "@/lib/site-content";
import { cn } from "@/lib/utils";
import { useOps } from "./ops";
import type { AdminTheme } from "./theme";
import { Badge, Button, Confirm, PageHead, Switch, type IconType } from "./ui";

export function Settings({ adminTheme, onAdminTheme }: { adminTheme: AdminTheme; onAdminTheme: (theme: AdminTheme) => void }) {
  const { reset } = useSiteContent();
  const { resetOps } = useOps();
  const { theme, setTheme } = useTheme();
  const [confirm, setConfirm] = useState<"content" | "ops" | null>(null);

  return (
    <div className="space-y-8">
      <PageHead title="إعدادات المتجر" lead="المظهر وبيانات المتجر وإدارة البيانات المحفوظة." />

      <Group title="المظهر">
        <SettingCard icon={Palette} title="الوضع الداكن للوحة التحكم" lead="اللوحة تبدأ بالوضع الفاتح. هذا الخيار للوحة فقط وما يغيّر المتجر.">
          <Switch checked={adminTheme === "dark"} label="الوضع الداكن للوحة التحكم" onChange={(next) => onAdminTheme(next ? "dark" : "light")} />
        </SettingCard>
        <SettingCard icon={Moon} title="الوضع الفاتح للمتجر" lead="يغيّر ألوان واجهة المتجر على هذا الجهاز. الوضع الداكن هو الأساسي للمتجر.">
          <Switch checked={theme === "light"} label="الوضع الفاتح للمتجر" onChange={(next) => setTheme(next ? "light" : "dark")} />
        </SettingCard>
      </Group>

      <Group title="بيانات المتجر">
        <SettingCard icon={Store} title="اسم المتجر والشعار" lead="سوق الكمبيوترات. الاسم والشعار يتعدّلوا من صفحة المحتوى والوسائط، تبويب الشعار.">
          <Badge tone="ok">متاح</Badge>
        </SettingCard>
        <SettingCard icon={Phone} title="بيانات التواصل" lead="رقم الجوال والواتساب والبريد في الفوتر. تتفعّل مع قاعدة البيانات في المرحلة الثالثة.">
          <Badge tone="blue">قريبًا</Badge>
        </SettingCard>
        <SettingCard icon={KeyRound} title="حسابات المسؤولين" lead="الدخول الحالي مؤقت. يتحول لنظام دخول آمن بصلاحيات (Supabase Auth) في المرحلة الثالثة.">
          <Badge tone="warn">مؤقت</Badge>
        </SettingCard>
      </Group>

      <Group title="البيانات المحفوظة">
        <SettingCard icon={RotateCcw} title="إرجاع محتوى المتجر الأصلي" lead="يرجّع كل النصوص والأسعار والإظهار والأرشيف للنسخة الافتراضية." tone="danger">
          <Button variant="danger" onClick={() => setConfirm("content")} className="h-9 px-3">
            إرجاع
          </Button>
        </SettingCard>
        <SettingCard icon={Truck} title="إرجاع إعدادات التشغيل" lead="يرجّع الشحن والمدفوعات والمخزون وتعديلات الطلبات التجريبية للإعداد الأولي." tone="danger">
          <Button variant="danger" onClick={() => setConfirm("ops")} className="h-9 px-3">
            إرجاع
          </Button>
        </SettingCard>
        <SettingCard icon={Database} title="قاعدة البيانات" lead="كل التعديلات حاليًا محفوظة في هذا المتصفح. الربط مع Supabase يخليها متاحة من أي جهاز.">
          <Badge>غير مربوطة</Badge>
        </SettingCard>
      </Group>

      <Confirm
        open={confirm === "content"}
        onClose={() => setConfirm(null)}
        onConfirm={reset}
        title="إرجاع المحتوى الأصلي؟"
        lead="كل النصوص والأسعار والإظهار والأرشيف ترجع للنسخة الافتراضية. ما يمكن التراجع عن هذي الخطوة."
        action="إرجاع الأصل"
      />
      <Confirm
        open={confirm === "ops"}
        onClose={() => setConfirm(null)}
        onConfirm={resetOps}
        title="إرجاع إعدادات التشغيل؟"
        lead="طرق الشحن والمناطق والمدفوعات والكميات وتعديلات الطلبات ترجع للإعداد الأولي."
        action="إرجاع الإعدادات"
      />
    </div>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="border-b border-(--a-line) pb-3 text-lg font-bold">{title}</h2>
      <div className="mt-4 grid gap-5 md:grid-cols-2 xl:grid-cols-3">{children}</div>
    </section>
  );
}

export function SettingCard({
  icon: Icon,
  title,
  lead,
  tone = "muted",
  children,
}: {
  icon: IconType;
  title: string;
  lead: string;
  tone?: "muted" | "danger";
  children: React.ReactNode;
}) {
  return (
    <article className="flex flex-col rounded-2xl border border-(--a-line) bg-(--a-surface) p-5 transition duration-200 hover:-translate-y-0.5 hover:shadow-(--a-shadow)">
      <div className="flex items-start justify-between gap-3">
        <span className={cn("grid size-10 shrink-0 place-items-center rounded-xl", tone === "danger" ? "bg-(--a-danger-soft) text-(--a-danger)" : "bg-(--a-surface-2) text-(--a-muted)")}>
          <Icon className="size-5" />
        </span>
        <div className="shrink-0">{children}</div>
      </div>
      <h3 className="mt-4 text-base font-bold">{title}</h3>
      <p className="mt-1 text-[13px] leading-6 text-(--a-muted)">{lead}</p>
    </article>
  );
}
