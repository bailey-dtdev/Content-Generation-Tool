import { GoogleG } from "@/components/ui/Icon";
import { API_BASE } from "@/lib/http";

export function Login() {
  return (
    <div className="login-bg">
      <div className="login">
        <div className="login__brand">
          <img src="/logo.svg" alt="Digital Treasury" />
          <span className="login__product">Content Studio</span>
        </div>

        <h1 className="login__h">
          Sign in to <span className="dt-highlight">Content Studio.</span>
        </h1>
        <p className="login__p">
          An internal tool for the Digital Treasury team. Use your{" "}
          <strong style={{ color: "var(--ink-1)" }}>
            @digitaltreasury.com.au
          </strong>{" "}
          Google account.
        </p>

        <a
          href={`${API_BASE}/api/v1/auth/login`}
          className="login__btn"
          style={{ textDecoration: "none" }}
        >
          <span className="login__google-mark">
            <GoogleG />
          </span>
          <span>Sign in with Google</span>
        </a>

        <div className="login__foot">
          Restricted to{" "}
          <strong style={{ color: "var(--ink-3)", fontWeight: 600 }}>
            @digitaltreasury.com.au
          </strong>
        </div>
      </div>
    </div>
  );
}
