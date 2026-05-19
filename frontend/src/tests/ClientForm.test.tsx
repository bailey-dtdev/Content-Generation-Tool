import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ClientForm } from "@/components/ClientForm";

describe("ClientForm", () => {
  it("submits the entered values as a client payload", async () => {
    const onSubmit = vi.fn();
    const { container } = render(<ClientForm onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Acme" } });
    const form = container.querySelector("form");
    if (form) fireEvent.submit(form);

    await waitFor(() => expect(onSubmit).toHaveBeenCalledOnce());
    expect(onSubmit.mock.calls[0][0]).toMatchObject({ name: "Acme" });
  });

  it("blocks submission when the name is empty", async () => {
    const onSubmit = vi.fn();
    const { container } = render(<ClientForm onSubmit={onSubmit} />);

    const form = container.querySelector("form");
    if (form) fireEvent.submit(form);

    await screen.findByText(/name is required/i);
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
