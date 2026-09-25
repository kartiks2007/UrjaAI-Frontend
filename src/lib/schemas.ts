import { z } from "zod";
const optionalText = z.string().max(2000).default("");
export const machineSchema = z.object({
  name: z.string().trim().min(2, "Enter a machine name.").max(100),
  machine_type: z.string().trim().min(2, "Enter the machine type.").max(100),
  manufacturer: optionalText,
  model: optionalText,
  location: optionalText,
  description: optionalText,
});
export const calibrationSchema = z
  .object({
    off_max_w: z.number().min(0),
    idle_max_w: z.number().positive(),
    hysteresis_w: z.number().min(0),
    minimum_duration_s: z.number().int().min(1),
    minimum_idle_s: z.number().int().min(1),
  })
  .refine((v) => v.idle_max_w > v.off_max_w, {
    path: ["idle_max_w"],
    message: "Idle upper threshold must exceed the OFF threshold.",
  })
  .refine((v) => v.hysteresis_w < (v.idle_max_w - v.off_max_w) / 2, {
    path: ["hysteresis_w"],
    message: "Hysteresis must be less than half the threshold gap.",
  });
export const deviceSchema = z.object({
  device_uid: z.string().trim().min(3).max(100),
  name: z.string().trim().min(2).max(100),
});
export const listingSchema = z
  .object({
    machine_id: z.string().min(1),
    title: z.string().trim().min(3).max(150),
    description: z.string().trim().min(15).max(3000),
    location: z.string().trim().min(2).max(200),
    pricing_model: z.enum(["ON_REQUEST", "HOURLY"]),
    price: z.number().min(0).nullable(),
    currency: z
      .string()
      .regex(/^[A-Z]{3}$/, "Use a three-letter currency code."),
  })
  .refine((v) => v.pricing_model !== "HOURLY" || v.price !== null, {
    path: ["price"],
    message: "Enter an hourly price.",
  });
export const intervalSchema = z
  .object({
    requested_start: z.string(),
    requested_end: z.string(),
    message: optionalText,
  })
  .superRefine((v, ctx) => {
    const start = Date.parse(v.requested_start),
      end = Date.parse(v.requested_end);
    if (!Number.isFinite(start) || start < Date.now())
      ctx.addIssue({
        code: "custom",
        path: ["requested_start"],
        message: "Choose a future start time.",
      });
    if (!Number.isFinite(end) || end <= start)
      ctx.addIssue({
        code: "custom",
        path: ["requested_end"],
        message: "End time must be after the start time.",
      });
  })
  .transform((v) => ({
    ...v,
    requested_start: new Date(v.requested_start).toISOString(),
    requested_end: new Date(v.requested_end).toISOString(),
  }));
export const organizationSchema = z
  .object({
    name: z.string().trim().min(2).max(150),
    location: optionalText,
    business_details: optionalText,
    electricity_tariff_per_kwh: z.number().min(0).nullable(),
    currency: z
      .string()
      .regex(
        /^[A-Z]{3}$/,
        "Use a three-letter currency code, for example INR.",
      ),
    emission_factor: z.number().min(0).nullable(),
    factor_source: optionalText,
  })
  .refine(
    (v) => v.emission_factor === null || v.factor_source.trim().length > 3,
    {
      path: ["factor_source"],
      message: "Provide the documented source for your emission factor.",
    },
  );
