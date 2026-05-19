/* global React, Icon, GoogleG */
// Login screens (default + rejected domain)

const LoginScreen = ({ rejected = false }) => (
  <div className="login-bg">
    <div className="login">
      <div className="login__brand">
        <img src="assets/logo.svg" alt="Digital Treasury" />
        <span className="login__product">Content Studio</span>
      </div>

      <h1 className="login__h">
        Sign in to <span className="dt-highlight">Content Studio.</span>
      </h1>
      <p className="login__p">
        An internal tool for the Digital Treasury team. Use your <strong style={{ color: 'var(--ink-1)' }}>@digitaltreasury.com.au</strong> Google account.
      </p>

      {rejected ? (
        <div className="login__error">
          <div className="login__error-icon">!</div>
          <div>
            <div className="login__error-title">That account isn't on the allowlist</div>
            <div className="login__error-body">
              You signed in as <strong>sam.fielding@gmail.com</strong>. Content Studio is restricted to <strong>@digitaltreasury.com.au</strong> Google accounts. Switch accounts and try again.
            </div>
          </div>
        </div>
      ) : null}

      <button type="button" className="login__btn">
        <span className="login__google-mark"><GoogleG /></span>
        <span>{rejected ? 'Try a different Google account' : 'Sign in with Google'}</span>
      </button>

      <div className="login__foot">
        Restricted to <strong style={{ color: 'var(--ink-3)', fontWeight: 600 }}>@digitaltreasury.com.au</strong> · Need access? Ask in #content-studio
      </div>
    </div>
  </div>
);

Object.assign(window, { LoginScreen });
