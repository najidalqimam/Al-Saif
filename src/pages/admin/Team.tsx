import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Eye, EyeOff, Pencil, Save, ShieldCheck, UserPlus, Users, UserX } from "lucide-react";
import { ApiError, PREVIEW, api, apiMessage } from "@/lib/api";
import { ROLE_LABELS, type AdminRole } from "@/lib/admin-auth";
import { useSiteContent } from "@/lib/site-content";
import { announceChange, useLiveRefresh } from "@/lib/live-sync";
import { ALL_PERMISSIONS, PERMISSION_LIST, ROLE_BASE, withViews, type Permission } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import { onHashMove, pushHash, readHash, registerLeaveGuard } from "./nav";
import { AR_DATE, Badge, Button, control, Empty, Field, IconButton, num, PageHead, Pager, Panel, SearchBox, SearchSelect, Select, StatCard, Switch, usePager } from "./ui";

// The dashboard's own staff: who can sign in and what each role may do. Only the owner manages the team.
// In the local preview the team lives in this browser; with the database it goes through /api/admin/team.
// The list is #team, adding is #team/add and editing is #team/<id>.

type Member = {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  jobTitle: string;
  role: AdminRole;
  /** Set for a shop account: the shop it belongs to. */
  shopId?: string | null;
  extraPermissions: Permission[];
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
};

const ROLES: AdminRole[] = ["OWNER", "MANAGER", "EDITOR", "SUPPORT"];
const ROLE_LEAD: Record<AdminRole, string> = {
  OWNER: "كل الصلاحيات، وإدارة فريق العمل.",
  MANAGER: "كل أقسام اللوحة ما عدا إدارة الفريق.",
  EDITOR: "المنتجات والأقسام والمحلات والمخزون.",
  SUPPORT: "الطلبات والعملاء، وعرض الباقي.",
  SHOP: "حساب محل: يدخل لوحة محله فقط (منتجاته وطلباته ومخزونه ومدفوعاته).",
};
const ROLE_TONE: Record<AdminRole, "accent" | "blue" | "ok" | "muted"> = { OWNER: "accent", MANAGER: "blue", EDITOR: "ok", SUPPORT: "muted", SHOP: "blue" };
/** Roles a new account can be given: the staff roles, or a shop account tied to one shop. */
const NEW_ROLES: AdminRole[] = [...ROLES, "SHOP"];

const MIN_PASSWORD = 12;
const STORAGE_KEY = "alsaif-admin-team";
const day = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString();
const PREVIEW_ME = "preview-owner";
const DEMO_TEAM: Member[] = [
  { id: PREVIEW_ME, email: "preview@localhost", fullName: "معاينة محلية", phone: "", jobTitle: "مالك المتجر", role: "OWNER", extraPermissions: [], isActive: true, lastLoginAt: day(0), createdAt: day(120) },
  { id: "t2", email: "manager@example.com", fullName: "نوف الحربي", phone: "0551112233", jobTitle: "مديرة العمليات", role: "MANAGER", extraPermissions: [], isActive: true, lastLoginAt: day(1), createdAt: day(80) },
  { id: "t3", email: "editor@example.com", fullName: "فيصل العنزي", phone: "0554445566", jobTitle: "مسؤول الكتالوج", role: "EDITOR", extraPermissions: ["orders.view"], isActive: true, lastLoginAt: day(3), createdAt: day(45) },
  { id: "t4", email: "support@example.com", fullName: "ريم الدوسري", phone: "0557778899", jobTitle: "خدمة العملاء", role: "SUPPORT", extraPermissions: [], isActive: false, lastLoginAt: day(30), createdAt: day(20) },
];

function readLocal(): Member[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
    if (Array.isArray(parsed) && parsed.length) return (parsed as Partial<Member>[]).map((row) => ({ phone: "", jobTitle: "", extraPermissions: [], ...row }) as Member);
  } catch {
    // Unreadable or blocked storage: the demo team is shown.
  }
  return DEMO_TEAM;
}

const MESSAGES: Record<string, string> = {
  EMAIL_TAKEN: "فيه موظف بنفس الإيميل.",
  CANNOT_CHANGE_SELF: "ما تقدر تغيّر دورك أو تعطّل حسابك بنفسك.",
  LAST_OWNER: "لازم يبقى مالك واحد فعّال على الأقل.",
  WEAK_PASSWORD: `كلمة السر لازم تكون ${MIN_PASSWORD} حرف على الأقل.`,
  FORBIDDEN_ROLE: "إدارة الفريق للمالك فقط.",
  MEMBER_NOT_FOUND: "الموظف غير موجود.",
};
const messageOf = (error: unknown) => (error instanceof ApiError && MESSAGES[error.code]) || apiMessage(error);

const date = (value: string | null, empty = "لم يدخل بعد") => (value ? new Date(value).toLocaleDateString(AR_DATE, { day: "numeric", month: "short", year: "numeric" }) : empty);

type NewMember = { fullName: string; email: string; phone: string; jobTitle: string; role: AdminRole; shopId?: string; extraPermissions: Permission[]; password: string };
type MemberChanges = { fullName?: string; phone?: string; jobTitle?: string; role?: AdminRole; extraPermissions?: Permission[]; isActive?: boolean; password?: string };

/** The team list and its changes, from this browser in the preview and from the API otherwise. */
function useTeam() {
  const [members, setMembers] = useState<Member[] | null>(null);
  const [me, setMe] = useState<string>(PREVIEW ? PREVIEW_ME : "");
  const [error, setError] = useState("");
  const [tick, setTick] = useState(0);
  useLiveRefresh("team", () => setTick((value) => value + 1));

  useEffect(() => {
    if (PREVIEW) {
      setMembers(readLocal());
      return;
    }
    const controller = new AbortController();
    api<{ members: Member[]; me: string }>("/admin/team", { signal: controller.signal })
      .then((result) => {
        setMembers(result.members);
        setMe(result.me);
        setError("");
      })
      .catch((failure) => {
        if (!controller.signal.aborted) setError(messageOf(failure));
      });
    return () => controller.abort();
  }, [tick]);

  const saveLocal = useCallback((next: Member[]) => {
    setMembers(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Storage blocked: the change stays for this visit.
    }
    // Other dashboard tabs of this browser show the change straight away.
    announceChange("team");
  }, []);

  const owners = (members ?? []).filter((member) => member.role === "OWNER" && member.isActive).length;

  /** Refuses a change that would lock the signed-in owner out or leave the store without an owner (the server enforces it too). */
  function guard(member: Member, next: { role?: AdminRole; isActive?: boolean }) {
    if (member.id === me && (next.role !== undefined || next.isActive === false)) return MESSAGES.CANNOT_CHANGE_SELF;
    const stays = (next.role ?? member.role) === "OWNER" && (next.isActive ?? member.isActive);
    if (member.role === "OWNER" && member.isActive && !stays && owners <= 1) return MESSAGES.LAST_OWNER;
    return "";
  }

  async function create(input: NewMember) {
    if ((members ?? []).some((row) => row.email === input.email)) throw new ApiError(409, "EMAIL_TAKEN");
    if (PREVIEW) {
      const member: Member = { id: `t-${Date.now().toString(36)}`, email: input.email, fullName: input.fullName, phone: input.phone, jobTitle: input.jobTitle, role: input.role, extraPermissions: input.extraPermissions, isActive: true, lastLoginAt: null, createdAt: new Date().toISOString() };
      saveLocal([...(members ?? []), member]);
      return;
    }
    const result = await api<{ member: Member }>("/admin/team", { body: input });
    setMembers((list) => [...(list ?? []), result.member]);
    announceChange("team");
  }

  async function update(id: string, changes: MemberChanges) {
    if (PREVIEW) {
      const { password: _password, ...rest } = changes;
      saveLocal((members ?? []).map((row) => (row.id === id ? { ...row, ...rest } : row)));
      return;
    }
    const result = await api<{ member: Member }>(`/admin/team/${id}`, { method: "PATCH", body: changes });
    setMembers((list) => (list ?? []).map((row) => (row.id === id ? result.member : row)));
    announceChange("team");
  }

  return { members, me, error, setError, guard, create, update };
}

export function Team() {
  const [sub, setSub] = useState(() => (readHash().view === "team" ? readHash().sub : null));
  useEffect(() => onHashMove(() => setSub(readHash().view === "team" ? readHash().sub : null)), []);
  const team = useTeam();
  if (sub === "add") return <TeamForm key="add" team={team} id={null} />;
  if (sub) {
    const id = sub.endsWith("/edit") ? sub.slice(0, -5) : sub;
    return <TeamForm key={id} team={team} id={id} />;
  }
  return <TeamList team={team} />;
}

type TeamApi = ReturnType<typeof useTeam>;

function TeamList({ team }: { team: TeamApi }) {
  const { members, me, error, setError, guard, update } = team;
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<AdminRole | "all">("all");

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (members ?? []).filter((member) => (roleFilter === "all" || member.role === roleFilter) && (!q || member.fullName.toLowerCase().includes(q) || member.email.includes(q)));
  }, [members, query, roleFilter]);
  const pager = usePager(shown, `${query}|${roleFilter}`);
  const active = (members ?? []).filter((member) => member.isActive).length;

  async function toggleActive(member: Member, isActive: boolean) {
    const blocked = guard(member, { isActive });
    if (blocked) return setError(blocked);
    setError("");
    try {
      await update(member.id, { isActive });
    } catch (failure) {
      setError(messageOf(failure));
    }
  }

  return (
    <div className="space-y-6">
      <PageHead
        title="فريق العمل"
        lead="الموظفين اللي يدخلون لوحة التحكم، ودور كل واحد منهم."
        actions={
          <Button variant="primary" icon={UserPlus} onClick={() => pushHash("team", "add")}>
            إضافة موظف
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="أعضاء الفريق" value={num.format(members?.length ?? 0)} note="كل الحسابات" icon={Users} tone="blue" />
        <StatCard label="الحسابات الفعّالة" value={num.format(active)} note="يقدرون يدخلون اللوحة" icon={ShieldCheck} tone="ok" />
        <StatCard label="حسابات معطّلة" value={num.format((members?.length ?? 0) - active)} note="ما يقدرون يدخلون" icon={UserX} tone="accent" />
      </div>

      <Panel>
        <div className="flex flex-wrap items-center gap-3 border-b border-(--a-line) p-4">
          <div className="min-w-56 flex-1">
            <SearchBox value={query} onChange={setQuery} placeholder="ابحث بالاسم أو الإيميل" />
          </div>
          <div className="w-48">
            <Select<AdminRole | "all"> label="الدور" hideLabel value={roleFilter} onChange={setRoleFilter} options={[["all", "كل الأدوار"], ...ROLES.map((role): [AdminRole, string] => [role, ROLE_LABELS[role]])]} />
          </div>
        </div>
        {error ? <p className="border-b border-(--a-line) p-4 text-sm text-(--a-danger)">{error}</p> : null}
        {members === null && !error ? (
          <p className="p-5 text-sm text-(--a-muted)">جاري التحميل…</p>
        ) : shown.length === 0 ? (
          <Empty icon={Users} title="ما فيه نتائج" lead="جرّب كلمة بحث أو دور ثاني." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-sm">
              <thead className="text-xs text-(--a-muted)">
                <tr>
                  <th className="px-5 py-3 text-start font-medium">الموظف</th>
                  <th className="px-3 py-3 text-start font-medium">الدور</th>
                  <th className="px-3 py-3 text-start font-medium">الجوال</th>
                  <th className="px-3 py-3 text-start font-medium">آخر دخول</th>
                  <th className="px-3 py-3 text-start font-medium">الحساب فعّال</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {pager.rows.map((member) => (
                  <tr key={member.id} className="border-t border-(--a-line)">
                    <td className="px-5 py-3">
                      <button type="button" onClick={() => pushHash("team", member.id)} className="flex cursor-pointer items-center gap-3 text-start">
                        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-(--a-surface-2) text-xs font-bold text-(--a-muted)">{member.fullName.trim().charAt(0)}</span>
                        <span>
                          <span className="block font-medium">
                            {member.fullName}
                            {member.id === me ? <span className="ms-2 text-xs font-normal text-(--a-muted)">(أنت)</span> : null}
                          </span>
                          <span className="block text-xs text-(--a-muted)" dir="ltr">
                            {member.email}
                          </span>
                        </span>
                      </button>
                    </td>
                    <td className="px-3 py-3">
                      <Badge tone={ROLE_TONE[member.role]}>{ROLE_LABELS[member.role]}</Badge>
                      {member.jobTitle ? <span className="mt-1 block text-xs text-(--a-muted)">{member.jobTitle}</span> : null}
                    </td>
                    <td className="px-3 py-3 text-(--a-muted)" dir="ltr">
                      <span className="block text-end">{member.phone || "—"}</span>
                    </td>
                    <td className="px-3 py-3 text-(--a-muted)">{date(member.lastLoginAt)}</td>
                    <td className="px-3 py-3">
                      <Switch checked={member.isActive} label={`تفعيل حساب ${member.fullName}`} onChange={(next) => void toggleActive(member, next)} />
                    </td>
                    <td className="px-5 py-3 text-end">
                      <IconButton icon={Pencil} label={`تعديل ${member.fullName}`} onClick={() => pushHash("team", member.id)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pager pager={pager} />
      </Panel>
    </div>
  );
}

type Form = { fullName: string; email: string; phone: string; jobTitle: string; role: AdminRole; shopId: string; extra: Permission[]; isActive: boolean; password: string; confirm: string };
const EMPTY: Form = { fullName: "", email: "", phone: "", jobTitle: "", role: "EDITOR", shopId: "", extra: [], isActive: true, password: "", confirm: "" };

/** A page of its own for adding a team member or editing one: details, role and permissions, and sign-in. */
function TeamForm({ team, id }: { team: TeamApi; id: string | null }) {
  const { members, me, guard, create, update } = team;
  const { shops } = useSiteContent();
  const member = id ? (members ?? []).find((row) => row.id === id) : undefined;
  const initial = useMemo<Form>(() => (member ? { ...EMPTY, fullName: member.fullName, email: member.email, phone: member.phone, jobTitle: member.jobTitle, role: member.role, shopId: member.shopId ?? "", extra: [...member.extraPermissions].sort(), isActive: member.isActive } : EMPTY), [member]);
  const [form, setForm] = useState<Form>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [tried, setTried] = useState(false);
  const loaded = useRef(false);
  // The member arrives after the list loads: fill the form once, then leave the user's typing alone.
  useEffect(() => {
    if (member && !loaded.current) {
      loaded.current = true;
      setForm(initial);
    }
  }, [member, initial]);

  const set = (patch: Partial<Form>) => setForm((current) => ({ ...current, ...patch }));
  const dirty = JSON.stringify({ ...form, extra: [...form.extra].sort() }) !== JSON.stringify(initial);
  const fromRole = withViews(ROLE_BASE[form.role]);
  const extraSet = withViews(form.extra.filter((key) => !fromRole.has(key)));
  const setRole = (role: AdminRole) => {
    const base = withViews(ROLE_BASE[role]);
    // Extras the new role already grants are dropped, so nothing is listed twice.
    setForm((current) => ({ ...current, role, extra: current.extra.filter((key) => !base.has(key)) }));
  };
  const grantable = ALL_PERMISSIONS.filter((key) => !fromRole.has(key));
  const allChecked = grantable.length > 0 && grantable.every((key) => form.extra.includes(key));
  const toggleExtra = (key: Permission, on: boolean) => setForm((current) => ({ ...current, extra: on ? [...new Set([...current.extra, key])] : current.extra.filter((value) => value !== key) }));
  const unsaved = useRef(false);
  unsaved.current = dirty;
  const self = id !== null && id === me;

  const email = form.email.trim().toLowerCase();
  const problems: Partial<Record<keyof Form, string>> = {};
  if (form.fullName.trim().length < 2) problems.fullName = "اكتب اسم الموظف.";
  if (form.role === "SHOP" && !form.shopId) problems.shopId = "اختر المحل اللي يتبعه هذا الحساب.";
  if (!id && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) problems.email = "اكتب إيميل صحيح.";
  if (form.phone && !/^[0-9+\s-]{6,40}$/.test(form.phone.trim())) problems.phone = "رقم الجوال غير صحيح.";
  if (!id || form.password) {
    if (form.password.length < MIN_PASSWORD) problems.password = MESSAGES.WEAK_PASSWORD;
    else if (form.password !== form.confirm) problems.confirm = "كلمتا السر مو متطابقتين.";
  }
  const show = (key: keyof Form) => (tried ? problems[key] : undefined);

  const saveRef = useRef<() => Promise<boolean>>(async () => true);
  useEffect(() => registerLeaveGuard(() => unsaved.current, { save: () => saveRef.current(), anySub: true }), []);
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  async function save(leave = true): Promise<boolean> {
    if (saving) return false;
    setTried(true);
    if (Object.keys(problems).length) {
      setError("راجع الحقول المعلّمة قبل الحفظ.");
      return false;
    }
    if (member) {
      const blocked = guard(member, { role: form.role === member.role ? undefined : form.role, isActive: form.isActive === member.isActive ? undefined : form.isActive });
      if (blocked) {
        setError(blocked);
        return false;
      }
    }
    setSaving(true);
    setError("");
    try {
      if (member) {
        await update(member.id, {
          fullName: form.fullName.trim(),
          phone: form.phone.trim(),
          jobTitle: form.jobTitle.trim(),
          ...(member.role !== "SHOP" && form.role !== member.role ? { role: form.role } : {}),
          // A shop account's limits come from its role, so nothing extra is sent for it.
          ...(member.role === "SHOP" ? {} : { extraPermissions: form.extra }),
          ...(form.isActive !== member.isActive ? { isActive: form.isActive } : {}),
          ...(form.password ? { password: form.password } : {}),
        });
      } else {
        await create({ fullName: form.fullName.trim(), email, phone: form.phone.trim(), jobTitle: form.jobTitle.trim(), role: form.role, ...(form.role === "SHOP" ? { shopId: form.shopId } : {}), extraPermissions: form.role === "SHOP" ? [] : form.extra, password: form.password });
      }
      // Saved: nothing is left to lose, so the leave prompt must not ask again.
      unsaved.current = false;
      if (leave) pushHash("team");
      return true;
    } catch (failure) {
      setError(messageOf(failure));
      return false;
    } finally {
      setSaving(false);
    }
  }
  saveRef.current = () => save(false);

  if (id && members !== null && !member) {
    return (
      <div className="space-y-6">
        <PageHead title="موظف" />
        <Panel>
          <Empty icon={Users} title="ما لقينا هذا الموظف" lead="يمكن الرابط غلط. ارجع لقائمة فريق العمل." />
        </Panel>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHead
        title={id ? `تعديل: ${member?.fullName ?? ""}` : "إضافة موظف"}
        lead={dirty ? "فيه تعديلات غير محفوظة. اضغط حفظ عشان تتسجل." : id ? "بيانات الموظف ودوره وصلاحياته." : "أدخل بيانات الموظف، واختر دوره، وحط كلمة السر اللي يدخل بها."}
        actions={
          <>
            <Button onClick={() => pushHash("team")} disabled={saving}>
              إلغاء
            </Button>
            <Button variant="primary" icon={Save} onClick={() => void save()} disabled={saving || (!!id && !dirty)}>
              {saving ? "جاري الحفظ…" : id ? "حفظ التعديلات" : "إضافة الموظف"}
            </Button>
          </>
        }
      />

      {error ? (
        <p role="alert" className="rounded-xl border border-(--a-danger)/30 px-4 py-3 text-sm text-(--a-danger)">
          {error}
        </p>
      ) : null}

      <Panel title="البيانات الشخصية">
        <div className="grid gap-4 p-5 sm:grid-cols-2">
          <FieldBlock error={show("fullName")}>
            <Field label="الاسم الكامل (مطلوب)" value={form.fullName} onChange={(fullName) => set({ fullName })} />
          </FieldBlock>
          <FieldBlock error={show("email")}>
            <Field label="الإيميل (مطلوب، يدخل به اللوحة)" value={form.email} onChange={(next) => set({ email: next })} type="email" dir="ltr" disabled={id !== null} />
          </FieldBlock>
          <FieldBlock error={show("phone")}>
            <Field label="رقم الجوال (اختياري)" value={form.phone} onChange={(phone) => set({ phone })} dir="ltr" placeholder="05xxxxxxxx" />
          </FieldBlock>
          <Field label="المسمى الوظيفي (اختياري)" value={form.jobTitle} onChange={(jobTitle) => set({ jobTitle })} placeholder="مثال: مسؤول الكتالوج" />
        </div>
      </Panel>

      <Panel title="الدور والصلاحيات" lead={self ? "ما تقدر تغيّر دورك بنفسك." : "الدور يحدد الأقسام اللي يقدر الموظف يفتحها ويعدّل فيها."}>
        <div className="space-y-2 p-5">
          <SearchSelect<AdminRole> label="الدور (مطلوب)" value={form.role} onChange={setRole} disabled={self || member?.role === "SHOP"} options={(member ? (member.role === "SHOP" ? ["SHOP" as AdminRole] : ROLES) : NEW_ROLES).map((role): [AdminRole, string] => [role, ROLE_LABELS[role]])} />
          <p className="text-xs text-(--a-muted)">{ROLE_LEAD[form.role]}</p>
        </div>
        {form.role === "SHOP" ? (
          <div className="space-y-2 border-t border-(--a-line) p-5">
            <FieldBlock error={show("shopId")}>
              <SearchSelect<string> label="المحل (مطلوب)" value={form.shopId} onChange={(shopId) => set({ shopId })} disabled={id !== null} options={[["", "اختر المحل"], ...shops.map((item): [string, string] => [item.id, item.name])]} />
            </FieldBlock>
            <p className="text-xs text-(--a-muted)">الحساب يدخل لوحة هذا المحل فقط، ويشوف منتجات المحل وطلباته ومخزونه، وما يقدر يفتح لوحة الإدارة.</p>
          </div>
        ) : (
        <div className="border-t border-(--a-line) p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold">صلاحيات إضافية لهذا الموظف فقط</h3>
              <p className="mt-0.5 text-xs text-(--a-muted)">الصلاحيات المعلّمة «من الدور» يعطيها الدور نفسه. علّم اللي تبي تزيده على دوره.</p>
            </div>
            {grantable.length ? (
              <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
                <input type="checkbox" checked={allChecked} onChange={(event) => setForm((current) => ({ ...current, extra: event.target.checked ? [...new Set([...current.extra, ...grantable])] : current.extra.filter((key) => !grantable.includes(key)) }))} className="size-4 accent-(--a-accent)" />
                تحديد الكل
              </label>
            ) : null}
          </div>
          <ul className="mt-4 grid gap-x-8 gap-y-1 sm:grid-cols-2">
            {PERMISSION_LIST.map((item) => {
              const byRole = fromRole.has(item.key);
              const impliedByEdit = !byRole && !form.extra.includes(item.key) && extraSet.has(item.key);
              const checked = byRole || extraSet.has(item.key);
              const locked = byRole || impliedByEdit;
              return (
                <li key={item.key}>
                  <label className={cn("flex items-center gap-3 rounded-lg px-2 py-2 text-sm transition", locked ? "cursor-default opacity-70" : "cursor-pointer hover:bg-(--a-surface-2)/50")}>
                    <input type="checkbox" checked={checked} disabled={locked} onChange={(event) => toggleExtra(item.key, event.target.checked)} className="size-4 accent-(--a-accent)" />
                    <span className="flex-1">{item.label}</span>
                    {byRole ? <Badge tone="muted">من الدور</Badge> : impliedByEdit ? <Badge tone="muted">مشمولة</Badge> : null}
                  </label>
                </li>
              );
            })}
          </ul>
          <p className="mt-3 text-xs text-(--a-muted)">مثال: محرر منتجات يحتاج يشوف الطلبات، علّم له «عرض الطلبات» من غير ما تغيّر دوره.</p>
        </div>
        )}
      </Panel>

      <Panel title="بيانات الدخول" lead={id ? "اترك كلمة السر فاضية لو ما تبي تغيّرها. تغييرها يخرج الموظف من كل الأجهزة." : `كلمة السر ${MIN_PASSWORD} حرف على الأقل.`}>
        <div className="grid gap-4 p-5 sm:grid-cols-2">
          <FieldBlock error={show("password")}>
            <PasswordField label={id ? "كلمة سر جديدة (اختياري)" : "كلمة السر (مطلوبة)"} value={form.password} onChange={(password) => set({ password })} />
          </FieldBlock>
          <FieldBlock error={show("confirm")}>
            <PasswordField label="تأكيد كلمة السر" value={form.confirm} onChange={(confirm) => set({ confirm })} />
          </FieldBlock>
          {PREVIEW ? <p className="text-xs text-(--a-muted) sm:col-span-2">في المعاينة المحلية كلمة السر ما تنحفظ، لأن الدخول بدون حساب.</p> : null}
          {id ? (
            <div className="flex items-center justify-between gap-4 rounded-xl border border-(--a-line) p-4 sm:col-span-2">
              <div>
                <p className="font-medium">الحساب فعّال</p>
                <p className="mt-0.5 text-xs text-(--a-muted)">{self ? "ما تقدر تعطّل حسابك بنفسك." : "الحساب المعطّل ما يقدر يدخل اللوحة، وتنتهي جلساته المفتوحة."}</p>
              </div>
              <Switch checked={form.isActive} label="الحساب فعّال" onChange={(isActive) => set({ isActive })} disabled={self} />
            </div>
          ) : null}
        </div>
      </Panel>

      {member ? (
        <Panel title="معلومات الحساب">
          <dl className="grid gap-4 p-5 text-sm sm:grid-cols-3">
            <Info label="تاريخ الإضافة" value={date(member.createdAt)} />
            <Info label="آخر دخول" value={date(member.lastLoginAt)} />
            <Info label="الحالة" value={member.isActive ? "فعّال" : "معطّل"} />
          </dl>
        </Panel>
      ) : null}
    </div>
  );
}

/** A password box with an eye button that shows or hides what is typed. */
function PasswordField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  const [shown, setShown] = useState(false);
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-(--a-muted)">{label}</span>
      <span className="relative block">
        <input dir="ltr" type={shown ? "text" : "password"} value={value} autoComplete="new-password" onChange={(event) => onChange(event.target.value)} className={cn(control, "h-10 ps-10 text-left")} />
        <button
          type="button"
          onClick={() => setShown((now) => !now)}
          aria-label={shown ? "إخفاء كلمة السر" : "إظهار كلمة السر"}
          aria-pressed={shown}
          // The password is typed left to right, so the eye sits on the left.
          className="absolute inset-y-0 left-1 grid w-9 cursor-pointer place-items-center rounded-lg text-(--a-muted) hover:text-(--a-text)"
        >
          {shown ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </span>
    </label>
  );
}

function FieldBlock({ error, children }: { error?: string; children: React.ReactNode }) {
  return (
    <div>
      {children}
      {error ? <p className="mt-1 text-xs text-(--a-danger)">{error}</p> : null}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-(--a-muted)">{label}</dt>
      <dd className="mt-0.5 font-medium">{value}</dd>
    </div>
  );
}
