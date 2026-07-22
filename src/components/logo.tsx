import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  iconOnly?: boolean;
  size?: "sm" | "md" | "lg";
}

const SIZE_MAP = {
  sm: { icon: 24, text: "text-sm" },
  md: { icon: 32, text: "text-xl" },
  lg: { icon: 44, text: "text-3xl" },
} as const;

export function Logo({ className, iconOnly = false, size = "md" }: LogoProps) {
  const { icon, text } = SIZE_MAP[size];

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <svg
        width={icon}
        height={icon}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="shrink-0"
      >
        <rect width="48" height="48" rx="10" fill="#0f172a" />
        <path
          d="M24 9c-6.6 0-12 5.4-12 12 0 9 12 21 12 21s12-12 12-21c0-6.6-5.4-12-12-12z"
          fill="#ef4444"
        />
        <circle cx="24" cy="21" r="5.2" fill="white" />
      </svg>
      {!iconOnly && (
        <span className={cn("font-bold tracking-tight text-slate-900", text)}>
          P.I.N.P.O.I.N.T.
        </span>
      )}
    </div>
  );
}
