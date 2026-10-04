import Link from "next/link";
import { ShieldCheck } from "lucide-react";

export function Logo() {
  return (
    <Link href="/" className="group inline-flex items-center gap-2.5" aria-label="Lumen home">
      <span className="relative grid size-7 place-items-center">
        <span className="absolute inset-0 rounded-full bg-light/30 blur-md transition group-hover:bg-light/50" />
        <svg viewBox="0 0 24 24" className="relative size-7" aria-hidden>
          <circle cx="12" cy="12" r="10" fill="none" stroke="var(--light)" strokeOpacity="0.5" />
          <path d="M12 2a10 10 0 0 1 0 20z" fill="var(--light)" />
        </svg>
      </span>
      <span className="font-serif text-2xl tracking-tight">Lumen</span>
    </Link>
  );
}

export function NeverDecides({ compact = false }: { compact?: boolean }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white/[0.03] px-3 py-1.5 text-xs text-muted"
      title="Lumen asks questions and reflects patterns. It never picks an option for you."
    >
      <ShieldCheck className="size-3.5 text-factor" />
      {compact ? "Never decides" : "Lumen never decides for you"}
    </span>
  );
}
