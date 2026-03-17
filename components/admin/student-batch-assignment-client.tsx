"use client";

import { useEffect, useState } from "react";

type BatchOption = {
  id: string;
  title: string;
  slug: string;
  examType: string;
  status: string;
  isPaid: boolean;
};

type ExistingAssignment = {
  id: string;
  batch: {
    id: string;
    title: string;
    slug: string;
    examType: string;
    status: string;
    isPaid: boolean;
  };
};

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T | null;
};

type Props = {
  studentId: string;
  studentName: string;
};

/**
 * Dedicated admin UI for assigning one student to one or more batches.
 *
 * Current behavior:
 * - checkbox multi-select
 * - save replaces full membership set
 */
export function StudentBatchAssignmentClient({
  studentId,
  studentName,
}: Props) {
  const [batchOptions, setBatchOptions] = useState<BatchOption[]>([]);
  const [selectedBatchIds, setSelectedBatchIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  async function loadData() {
    setLoading(true);
    setErrorMessage(null);

    try {
      const [optionsRes, assignedRes] = await Promise.all([
        fetch("/api/admin/batches/options", { cache: "no-store" }),
        fetch(`/api/admin/students/${studentId}/batches`, { cache: "no-store" }),
      ]);

      const optionsJson = (await optionsRes.json()) as ApiResponse<BatchOption[]>;
      const assignedJson = (await assignedRes.json()) as ApiResponse<
        ExistingAssignment[]
      >;

      if (!optionsRes.ok || !optionsJson.success || !optionsJson.data) {
        throw new Error(optionsJson.message || "Failed to load batch options.");
      }

      if (!assignedRes.ok || !assignedJson.success || !assignedJson.data) {
        throw new Error(
          assignedJson.message || "Failed to load assigned batches."
        );
      }

      setBatchOptions(optionsJson.data);
      setSelectedBatchIds(assignedJson.data.map((item) => item.batch.id));
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to load batch data."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, [studentId]);

  function toggleBatch(batchId: string) {
    setSuccessMessage(null);
    setSelectedBatchIds((previous) =>
      previous.includes(batchId)
        ? previous.filter((id) => id !== batchId)
        : [...previous, batchId]
    );
  }

  async function handleSave() {
    setSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const response = await fetch(`/api/admin/students/${studentId}/batches`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          batchIds: selectedBatchIds.length > 0 ? selectedBatchIds : [],
        }),
      });

      const json = (await response.json()) as ApiResponse<{
        totalAssigned: number;
      }>;

      if (!response.ok || !json.success) {
        throw new Error(json.message || "Failed to save student batch assignments.");
      }

      setSuccessMessage("Student batch assignments updated successfully.");
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Failed to save student batch assignments."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-3xl border bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-600">Loading batch assignment data...</p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border bg-white p-6 shadow-sm space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">
          Assign Batches
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Student: <span className="font-medium">{studentName}</span>
        </p>
      </div>

      {errorMessage ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {errorMessage}
        </div>
      ) : null}

      {successMessage ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          {successMessage}
        </div>
      ) : null}

      {batchOptions.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-6 text-sm text-slate-600">
          No batches found yet. Create batches first.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {batchOptions.map((batch) => {
            const selected = selectedBatchIds.includes(batch.id);

            return (
              <label
                key={batch.id}
                className={`flex items-start gap-3 rounded-2xl border p-4 cursor-pointer ${
                  selected
                    ? "border-slate-900 bg-slate-50"
                    : "border-slate-200 bg-white"
                }`}
              >
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={() => toggleBatch(batch.id)}
                  className="mt-1"
                />

                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-semibold text-slate-900">
                    {batch.title}
                  </h3>
                  <p className="mt-1 text-sm text-slate-600">
                    {batch.examType} • {batch.status} • {batch.isPaid ? "Paid" : "Free"}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">Slug: {batch.slug}</p>
                </div>
              </label>
            );
          })}
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={saving}
          className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:bg-slate-400"
        >
          {saving ? "Saving..." : "Save Batch Assignment"}
        </button>
      </div>
    </div>
  );
}