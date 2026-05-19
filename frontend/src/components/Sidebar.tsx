import { useLocation, useNavigate } from "react-router-dom";

import { Icon, type IconName } from "@/components/ui/Icon";
import { useAuthStore } from "@/stores/auth";

const NAV: { to: string; label: string; icon: IconName; match: string }[] = [
  { to: "/clients", label: "Clients", icon: "users", match: "/clients" },
  {
    to: "/generations/new",
    label: "New generation",
    icon: "sparkles",
    match: "/generations",
  },
  { to: "/usage", label: "Usage", icon: "bar-chart", match: "/usage" },
];

function initials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const displayName = user?.name ?? user?.email ?? "";

  return (
    <aside className="side">
      <div className="side__brand">
        <img src="/logo.svg" alt="Digital Treasury" />
      </div>
      <div className="side__product">Content Studio</div>

      <div className="side__group">
        <div className="side__label">Workspace</div>
        {NAV.map((item) => (
          <button
            key={item.to}
            type="button"
            className={`side__item ${
              location.pathname.startsWith(item.match) ? "is-active" : ""
            }`}
            onClick={() => navigate(item.to)}
          >
            <Icon name={item.icon} />
            <span>{item.label}</span>
          </button>
        ))}
      </div>

      <div className="side__foot">
        <div className="side__user">
          <div className="side__avatar">
            {displayName ? initials(displayName) : ""}
          </div>
          <div className="side__user-meta">
            <div className="side__user-name">{user?.name ?? "Signed in"}</div>
            <div className="side__user-email">{user?.email ?? ""}</div>
          </div>
        </div>
        <button
          type="button"
          className="side__signout"
          onClick={() => void logout()}
        >
          <Icon name="log-out" />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  );
}
