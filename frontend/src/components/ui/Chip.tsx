import type { ReactNode } from "react";

import { Icon, type IconName } from "@/components/ui/Icon";

export function Chip({
  variant,
  icon,
  dot,
  children,
}: {
  variant?: "outline" | "aqua" | "dark" | "err" | "warn" | "info" | "ok";
  icon?: IconName;
  dot?: boolean;
  children: ReactNode;
}) {
  return (
    <span className={`chip ${variant ? `chip--${variant}` : ""}`}>
      {dot ? <span className="chip__dot" /> : null}
      {icon ? <Icon name={icon} size={12} /> : null}
      {children}
    </span>
  );
}
