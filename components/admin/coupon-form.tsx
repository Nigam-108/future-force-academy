"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type BatchOption = {
  id: string;
  title: string;
  examType: string;
  status: string;
};

type FormValues = {
  description: string;
  discountType: "PERCENTAGE" | "FLAT";
  discountValue: number | "";
  maxUsageLimit: number | undefined;
  perStudentLimit: number;
  batchId: string;
  expiresAt: string;
  isActive: boolean;
};

type Props =
  | {
      mode: "create";
      batchOptions: BatchOption[];
      redirectOnSuccess: string;
    }
  | {
      mode: "edit";
      couponId: string;
      initialValues: FormValues;
      batchOptions: BatchOption[];
      redirectOnSuccess: string;
    };

type ApiResponse = {
  success: boolean;
  message: string;
  data?: { id: string };
};

export function CouponForm(props: Props) {
  const router = useRouter();

  const initial: FormValues =
    props.mode === "edit"
      ? props.initialValues
      : {
          description: "",
          discountType: "PERCENTAGE",
          discountValue: "",
          maxUsageLimit: undefined,
          perStudentLimit: 1,
          batchId: "",
          expiresAt: "",
          isActive: true,
        };

  const [code, setCode] = useState(
    props.mode === "create" ? "" : ""
  );
  const [values, setValues] = useState<FormValues>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function update<K extends keyof FormValues>(
    key: K,
    value: FormValues[K]
  ) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit() {
    setError(null);
    setSuccess(null);

    // Validate
    if (props.mode === "create" && !code.trim()) {
      setError("Coupon code is required");
      return;
    }
    if (!values.discountValue || Number(values.discountValue) <= 0) {
      setError("Discount value must be positive");
      return;
    }
    if (
      values.discountType === "PERCENTAGE" &&
      Number(values.discountValue) > 100
    ) {
      setError("Percentage discount cannot exceed 100%");
      return;
    }

    setSaving(true);

    const payload =
      props.mode === "create"
        ? {
            code: code.toUpperCase().trim(),
            description: values.description.trim() || undefined,
            discountType: values.discountType,
            discountValue:
              values.discountType === "FLAT"
                ? Math.round(Number(values.discountValue) * 100) // convert rupees to paise for FLAT
                : Number(values.discountValue),
            maxUsageLimit: values.maxUsageLimit || undefined,
            perStudentLimit: values.perStudentLimit,
            batchId: values.batchId || undefined,
            expiresAt: values.expiresAt
              ? new Date(values.expiresAt).toISOString()
              : undefined,
            isActive: values.isActive,
          }
        : {
            description: values.description.trim() || undefined,
            discountType: values.discountType,
            discountValue:
              values.discountType === "FLAT"
                ? Math.round(Number(values.discountValue) * 100)
                : Number(values.discountValue),
            maxUsageLimit: values.maxUsageLimit || undefined,
            perStudentLimit: values.perStudentLimit,
            batchId: values.batchId || undefined,
            expiresAt: values.expiresAt
              ? new Date(values.expiresAt).toISOString()
              : undefined,
            isActive: values.isActive,
          };

    try {
      const url =
        props.mode === "create"
          ? "/api/admin/coupons"
          : `/api/admin/coupons/${props.couponId}`;

      const response = await fetch(url, {
        method: props.mode === "create" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = (await response.json()) as ApiResponse;

      if (!response.ok || !json.success) {
        throw new Error(json.message || "Failed to save coupon");
      }

      setSuccess(
        props.mode === "create"
          ? "Coupon created successfully!"
          : "Coupon updated successfully!"
      );

      setTimeout(() => {
        router.push(props.redirectOnSuccess);
        router.refresh();
      }, 1000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save coupon"
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error}
        </div>
      ) : null}
      {success ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          {success}
        </div>
      ) : null}

      {/* Code — only on create */}
      {props.mode === "create" ? (
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-slate-700">
            Coupon Code <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="e.g. LAUNCH20"
            maxLength={20}
            className="w-full rounded-xl border px-4 py-3 text-sm font-mono uppercase"
          />
          <p className="text-xs text-slate-400">
            Only letters, numbers, hyphens, underscores. Max 20 chars.
          </p>
        </div>
      ) : null}

      {/* Description */}
      <div className="space-y-1.5">
        <label className="text-sm font-semibold text-slate-700">
          Description
        </label>
        <input
          type="text"
          value={values.description}
          onChange={(e) => update("description", e.target.value)}
          placeholder="e.g. 20% off for launch week"
          className="w-full rounded-xl border px-4 py-3 text-sm"
        />
      </div>

      {/* Discount type + value */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-slate-700">
            Discount Type <span className="text-rose-500">*</span>
          </label>
          <select
            value={values.discountType}
            onChange={(e) =>
              update("discountType", e.target.value as "PERCENTAGE" | "FLAT")
            }
            className="w-full rounded-xl border px-4 py-3 text-sm text-slate-700"
          >
            <option value="PERCENTAGE">Percentage (e.g. 20%)</option>
            <option value="FLAT">Flat amount (e.g. ₹50 off)</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-slate-700">
            Discount Value <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">
              {values.discountType === "PERCENTAGE" ? "%" : "₹"}
            </span>
            <input
              type="number"
              min="1"
              max={values.discountType === "PERCENTAGE" ? 100 : undefined}
              step="1"
              value={values.discountValue}
              onChange={(e) =>
                update(
                  "discountValue",
                  e.target.value === "" ? "" : Number(e.target.value)
                )
              }
              placeholder={
                values.discountType === "PERCENTAGE" ? "20" : "50"
              }
              className="w-full rounded-xl border py-3 pl-8 pr-4 text-sm"
            />
          </div>
          <p className="text-xs text-slate-400">
            {values.discountType === "PERCENTAGE"
              ? "1–100"
              : "Amount in rupees (e.g. 50 = ₹50 off)"}
          </p>
        </div>
      </div>

      {/* Batch specific */}
      <div className="space-y-1.5">
        <label className="text-sm font-semibold text-slate-700">
          Applicable Batch{" "}
          <span className="font-normal text-slate-400">(optional)</span>
        </label>
        <select
          value={values.batchId}
          onChange={(e) => update("batchId", e.target.value)}
          className="w-full rounded-xl border px-4 py-3 text-sm text-slate-700"
        >
          <option value="">All batches (global coupon)</option>
          {props.batchOptions.map((b) => (
            <option key={b.id} value={b.id}>
              {b.title} ({b.examType})
            </option>
          ))}
        </select>
        <p className="text-xs text-slate-400">
          Leave blank to allow on any batch.
        </p>
      </div>

      {/* Usage limits */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-slate-700">
            Max Total Uses{" "}
            <span className="font-normal text-slate-400">(optional)</span>
          </label>
          <input
            type="number"
            min="1"
            step="1"
            value={values.maxUsageLimit ?? ""}
            onChange={(e) =>
              update(
                "maxUsageLimit",
                e.target.value === "" ? undefined : Number(e.target.value)
              )
            }
            placeholder="Unlimited"
            className="w-full rounded-xl border px-4 py-3 text-sm"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-slate-700">
            Uses Per Student
          </label>
          <input
            type="number"
            min="1"
            step="1"
            value={values.perStudentLimit}
            onChange={(e) =>
              update("perStudentLimit", Number(e.target.value))
            }
            className="w-full rounded-xl border px-4 py-3 text-sm"
          />
          <p className="text-xs text-slate-400">
            Usually 1 — prevents reuse.
          </p>
        </div>
      </div>

      {/* Expiry date */}
      <div className="space-y-1.5">
        <label className="text-sm font-semibold text-slate-700">
          Expiry Date{" "}
          <span className="font-normal text-slate-400">(optional)</span>
        </label>
        <input
          type="date"
          value={values.expiresAt}
          onChange={(e) => update("expiresAt", e.target.value)}
          className="w-full rounded-xl border px-4 py-3 text-sm text-slate-700 md:max-w-xs"
        />
      </div>

      {/* Active toggle */}
      <label className="flex cursor-pointer items-center gap-3">
        <input
          type="checkbox"
          checked={values.isActive}
          onChange={(e) => update("isActive", e.target.checked)}
          className="h-4 w-4"
        />
        <span className="text-sm font-medium text-slate-700">
          Active — students can use this coupon
        </span>
      </label>

      <button
        type="button"
        onClick={() => void handleSubmit()}
        disabled={saving}
        className="rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:bg-slate-400"
      >
        {saving
          ? "Saving..."
          : props.mode === "create"
          ? "Create Coupon"
          : "Update Coupon"}
      </button>
    </div>
  );
}