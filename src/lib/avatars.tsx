import { Gamepad2, Headphones, Laptop, Monitor, Rocket, Smartphone, UserRound, type LucideIcon } from "lucide-react";

// Preset avatars a customer can pick on the account page. Only the id is saved (customers.avatar); the server
// accepts exactly these ids (AVATARS in server/src/routes/account.ts).

type Preset = { id: string; color: string; icon?: LucideIcon };

export const AVATAR_PRESETS: Preset[] = [
  { id: "initials-blue", color: "#2563eb" },
  { id: "initials-navy", color: "#111d32" },
  { id: "initials-green", color: "#12875a" },
  { id: "initials-orange", color: "#ea580c" },
  { id: "initials-pink", color: "#db2777" },
  { id: "initials-purple", color: "#7c3aed" },
  { id: "gamepad", color: "#1d4ed8", icon: Gamepad2 },
  { id: "laptop", color: "#0f766e", icon: Laptop },
  { id: "headphones", color: "#9333ea", icon: Headphones },
  { id: "smartphone", color: "#be123c", icon: Smartphone },
  { id: "monitor", color: "#334155", icon: Monitor },
  { id: "rocket", color: "#c2410c", icon: Rocket },
];

/** First letter of the first and last name ("ل م"); one letter when there is no last name. */
function initials(firstName: string, lastName: string) {
  return [firstName, lastName]
    .map((part) => Array.from(part.trim())[0] ?? "")
    .join("")
    .toUpperCase();
}

/** A round avatar: the chosen preset, or the plain person icon when none is chosen. */
export function Avatar({
  avatar,
  firstName,
  lastName,
  className = "size-8 text-xs",
}: {
  avatar: string | null | undefined;
  firstName: string;
  lastName: string;
  className?: string;
}) {
  const preset = AVATAR_PRESETS.find((item) => item.id === avatar);
  if (!preset) {
    return (
      <span aria-hidden className={`grid shrink-0 place-items-center rounded-full ${className}`}>
        <UserRound className="size-[60%]" />
      </span>
    );
  }
  const Icon = preset.icon;
  return (
    <span aria-hidden className={`grid shrink-0 place-items-center rounded-full font-bold text-white ${className}`} style={{ background: preset.color }}>
      {Icon ? <Icon className="size-[55%]" /> : <span dir="auto">{initials(firstName, lastName)}</span>}
    </span>
  );
}
