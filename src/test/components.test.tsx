import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Status, Modal, Empty } from "../components/ui";
import { DataForm } from "../components/DataForm";
import { machineSchema } from "../lib/schemas";
describe("Accessible product states", () => {
  it("labels a stale machine separately from an offline device", () => {
    render(
      <>
        <Status value="RUNNING" stale />
        <Status value="OFFLINE" />
      </>,
    );
    expect(screen.getByText("Running · stale")).toBeVisible();
    expect(screen.getByText("Offline")).toBeVisible();
  });
  it("provides an honest empty state", () => {
    render(
      <Empty
        title="No telemetry received"
        description="Waiting for a connected device."
      />,
    );
    expect(
      screen.getByRole("heading", { name: "No telemetry received" }),
    ).toBeVisible();
  });
  it("gives dialogs a title and description", () => {
    render(
      <Modal
        open
        onOpenChange={() => {}}
        title="Publish listing?"
        description="You control publication."
      >
        Test-only content
      </Modal>,
    );
    expect(
      screen.getByRole("dialog", { name: "Publish listing?" }),
    ).toHaveAccessibleDescription("You control publication.");
  });
  it("validates invalid machine fields before a request", async () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter>
          <DataForm
            path="/machines"
            schema={machineSchema}
            fields={[
              { name: "name", label: "Machine name" },
              { name: "machine_type", label: "Type" },
            ]}
          />
        </MemoryRouter>
      </QueryClientProvider>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));
    expect(screen.getByText("Enter a machine name.")).toBeVisible();
    expect(screen.getByText("Enter the machine type.")).toBeVisible();
  });
});
