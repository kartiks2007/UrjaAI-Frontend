import { describe, expect, it } from "vitest";
import {
  calibrationSchema,
  intervalSchema,
  listingSchema,
  machineSchema,
  organizationSchema,
} from "../lib/schemas";
import { money, number, safeRedirect } from "../lib/utils";
describe("Domain form validation", () => {
  it("requires useful machine identity", () => {
    expect(
      machineSchema.safeParse({ name: "", machine_type: "" }).success,
    ).toBe(false);
    expect(
      machineSchema.safeParse({
        name: "Press 01",
        machine_type: "Hydraulic press",
      }).success,
    ).toBe(true);
  });
  it("rejects inverted thresholds and excessive hysteresis", () => {
    const valid = {
      off_max_w: 10,
      idle_max_w: 80,
      hysteresis_w: 5,
      minimum_duration_s: 15,
      minimum_idle_s: 300,
    };
    expect(calibrationSchema.safeParse(valid).success).toBe(true);
    expect(
      calibrationSchema.safeParse({ ...valid, idle_max_w: 5 }).success,
    ).toBe(false);
    expect(
      calibrationSchema.safeParse({ ...valid, hysteresis_w: 40 }).success,
    ).toBe(false);
  });
  it("rejects past and reversed booking windows", () => {
    expect(
      intervalSchema.safeParse({
        requested_start: "2001-01-01",
        requested_end: "2002-01-01",
      }).success,
    ).toBe(false);
    const start = new Date(Date.now() + 86400000).toISOString();
    expect(
      intervalSchema.safeParse({ requested_start: start, requested_end: start })
        .success,
    ).toBe(false);
    const result = intervalSchema.safeParse({
      requested_start: start,
      requested_end: new Date(Date.now() + 172800000).toISOString(),
    });
    expect(result.success).toBe(true);
  });
  it("requires a price for hourly listings", () => {
    const data = {
      machine_id: "fixture-machine",
      title: "Test listing",
      description: "Test-only description for a machine.",
      location: "Test city",
      pricing_model: "HOURLY",
      price: null,
      currency: "INR",
    };
    expect(listingSchema.safeParse(data).success).toBe(false);
    expect(listingSchema.safeParse({ ...data, price: 20 }).success).toBe(true);
  });
  it("requires evidence for a carbon factor and permits missing tariffs", () => {
    const data = {
      name: "Test organization",
      currency: "INR",
      electricity_tariff_per_kwh: null,
      emission_factor: null,
    };
    expect(organizationSchema.safeParse(data).success).toBe(true);
    expect(
      organizationSchema.safeParse({ ...data, emission_factor: 0.7 }).success,
    ).toBe(false);
    expect(
      organizationSchema.safeParse({
        ...data,
        emission_factor: 0.7,
        factor_source: "Documented source 2026",
      }).success,
    ).toBe(true);
  });
});
describe("Truthful formatting and safe routing", () => {
  it("distinguishes zero from absent data", () => {
    expect(number(null)).toBe("—");
    expect(number(0)).toBe("0");
    expect(number(NaN)).toBe("—");
    expect(money(undefined)).toBe("—");
  });
  it("rejects external redirect targets", () => {
    for (const path of [
      "https://evil.example",
      "//evil.example",
      "/\\evil.example",
    ])
      expect(safeRedirect(path)).toBe("/dashboard");
    expect(safeRedirect("/machines")).toBe("/machines");
  });
});
