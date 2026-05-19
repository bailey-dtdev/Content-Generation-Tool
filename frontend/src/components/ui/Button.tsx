import type { ReactNode } from "react";

import { Icon, type IconName } from "@/components/ui/Icon";

export function Button({
  variant = "secondary",
  size,
  icon,
  iconRight,
  children,
  type = "button",
  onClick,
  disabled,
  className,
  form,
}: {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "lg";
  icon?: IconName;
  iconRight?: IconName;
  children?: ReactNode;
  type?: "button" | "submit";
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  form?: string;
}) {
  const classes = ["btn", `btn--${variant}`, size && `btn--${size}`, className]
    .filter(Boolean)
    .join(" ");
  return (
    <button
      type={type}
      form={form}
      onClick={onClick}
      disabled={disabled}
      className={classes}
    >
      {icon ? <Icon name={icon} /> : null}
      {children}
      {iconRight ? <Icon name={iconRight} /> : null}
    </button>
  );
}
