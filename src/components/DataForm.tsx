import { useState, type FormEvent } from "react";
import { z } from "zod";
import { useAction } from "../api/hooks";
import { ApiError } from "../api/client";
import { usePreview } from "../auth/AuthProvider";
import { Button, Feedback, Field } from "./ui";
export interface FormField {
  name: string;
  label: string;
  type?:
    | "text"
    | "email"
    | "number"
    | "textarea"
    | "datetime-local"
    | "select"
    | "tel";
  required?: boolean;
  min?: number;
  step?: string;
  hint?: string;
  options?: string[];
  value?: string | number | null;
}
export function DataForm({
  fields,
  path,
  method = "POST",
  schema,
  submit = "Save changes",
  onSaved,
  extra = {},
  disabled = false,
}: {
  fields: FormField[];
  path: string;
  method?: string;
  schema: z.ZodType;
  submit?: string;
  onSaved?: (result: unknown) => void;
  extra?: Record<string, unknown>;
  disabled?: boolean;
}) {
  const action = useAction(path, method);
  const preview = usePreview();
  const [errors, setErrors] = useState<Record<string, string>>({});
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    action.reset();
    const form = new FormData(event.currentTarget);
    const raw: Record<string, unknown> = { ...extra };
    for (const field of fields) {
      const value = String(form.get(field.name) ?? "").trim();
      raw[field.name] =
        field.type === "number" ? (value === "" ? null : Number(value)) : value;
    }
    const parsed = schema.safeParse(raw);
    if (!parsed.success) {
      setErrors(
        Object.fromEntries(
          parsed.error.issues.map((issue) => [
            String(issue.path[0]),
            issue.message,
          ]),
        ),
      );
      return;
    }
    setErrors({});
    try {
      const result = await action.mutateAsync(parsed.data);
      onSaved?.(result);
    } catch (error) {
      if (error instanceof ApiError && error.details.length) setErrors(Object.fromEntries(error.details.map(item => [item.path.split(".")[0], item.message])));
    }
  }
  return (
    <form onSubmit={save} className="data-form" noValidate>
      <div className="form-grid">
        {fields.map((field) => (
          <Field
            key={field.name}
            label={field.label}
            error={errors[field.name]}
            hint={field.hint}
          >
            {(id) =>
              field.type === "textarea" ? (
                <textarea
                  id={id}
                  name={field.name}
                  defaultValue={field.value ?? ""}
                  rows={4}
                  aria-invalid={!!errors[field.name]}
                  required={field.required}
                />
              ) : field.type === "select" ? (
                <select
                  id={id}
                  name={field.name}
                  defaultValue={field.value ?? field.options?.[0]}
                  aria-invalid={!!errors[field.name]}
                  required={field.required}
                >
                  {field.options?.map((option) => (
                    <option key={option} value={option}>
                      {option.replaceAll("_", " ")}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  id={id}
                  name={field.name}
                  type={field.type ?? "text"}
                  inputMode={field.type === "tel" ? "tel" : field.type === "number" ? "decimal" : undefined}
                  autoComplete={field.type === "tel" ? "tel" : undefined}
                  min={field.min}
                  step={field.step ?? "any"}
                  defaultValue={field.value ?? ""}
                  required={field.required}
                  aria-invalid={!!errors[field.name]}
                />
              )
            }
          </Field>
        ))}
      </div>
      {action.isError && <Feedback kind="error" title={action.error.message} />}{" "}
      {action.isSuccess && (
        <Feedback kind="success" title="Changes saved successfully" />
      )}
      {preview && (
        <p className="muted small">
          Design review is read-only. Your backend will store these changes when
          connected.
        </p>
      )}
      <div className="form-footer">
        <Button
          type="submit"
          disabled={preview || disabled || action.isPending}
        >
          {action.isPending ? "Saving…" : submit}
        </Button>
      </div>
    </form>
  );
}
