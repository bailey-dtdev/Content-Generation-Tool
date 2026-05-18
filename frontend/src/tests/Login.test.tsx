import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Login } from "@/routes/Login";

describe("Login", () => {
  it("renders a Google sign-in link pointing at the auth endpoint", () => {
    render(<Login />);
    const link = screen.getByRole("link", { name: /sign in with google/i });
    expect(link.getAttribute("href")).toContain("/api/v1/auth/login");
  });
});
