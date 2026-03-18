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

type CurrentAssignment = {
  id: string;
  batch: BatchOption;
};

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T | null;
};

type Props = {
  testId: string;
  testTitle: string;
};

export function TestBatchAssignmentClient({ testId, testTitle }: Props) {
  const [batchOptions, setBatchOptions] = useState<BatchOption[]>([]);
  const [selectedBatchIds, setSelectedBatchIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isGlobal, setIsGlobal] = useState(true);

  async function loadData() {
    setLoading(true);
    setErrorMessage(null);

    try {
      const [optionsRes, assignedRes] = await Promise.all([
        fetch("/api/admin/batches/options", { cache: "no-store" }),
        fetch(`/api/admin/tests/${testId}/batches`, { cache: "no-store" }),
      ]);

      const optionsJson = (await optionsRes.json()) as ApiResponse<BatchOption[]>;
      const assignedJson = (await assignedRes.json()) as ApiResponse<{
        assignments: CurrentAssignment[];
        isGlobal: boolean;
      }>;

      if (!optionsRes.ok || !optionsJson.success || !optionsJson.data) {
        throw new Error(optionsJson.message || "Failed to load batch options.");
      }

      if (!assignedRes.ok || !assignedJson.success || !assignedJson.data) {
        throw new Error(assignedJson.message || "Failed to load batch assignments.");
      }

      setBatchOptions(optionsJson.data);
      setSelectedBatchIds(
        assignedJson.data.assignments.map((a) => a.batch.id)
      );
      setIsGlobal(assignedJson.data.isGlobal);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to load data."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, [testId]);

  function toggleBatch(batchId: string) {
    setSuccessMessage(null);
    setSelectedBatchIds((prev) =>
      prev.includes(batchId)
        ? prev.filter((id) => id !== batchId)
        : [...prev, batchId]
    );
  }

  async function handleSave() {
    setSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const response = await fetch(`/api/admin/tests/${testId}/batches`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ batchIds: selectedBatchIds }),
      });

      const json = (await response.json()) as ApiResponse<{
        totalAssigned: number;
        isGlobal: boolean;
      }>;

      if (!response.ok || !json.success || !json.data) {
        throw new Error(json.message || "Failed to save batch assignments.");
      }

      setIsGlobal(json.data.isGlobal);

      setSuccessMessage(
        json.data.isGlobal
          ? "Test is now global — visible to all students."
          : `Test restricted to ${json.data.totalAssigned} batch(es).`
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to save."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-3xl border bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-600">Loading batch data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
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

      <div className="rounded-3xl border bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-semibold text-slate-900">{testTitle}</h2>

        <div className="mt-4 flex flex-wrap gap-3">
          <div
            className={`rounded-2xl border px-4 py-3 text-sm font-medium ${
              isGlobal && selectedBatchIds.length === 0
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-amber-200 bg-amber-50 text-amber-700"
            }`}
          >
            {isGlobal && selectedBatchIds.length === 0
              ? "Global — visible to all students"
              : selectedBatchIds.length > 0
              ? `Restricted to ${selectedBatchIds.length} batch(es)`
              : "Currently global"}
          </div>
        </div>

        <p className="mt-4 text-sm text-slate-600">
          Select one or more batches to restrict this test. Leave all unchecked
          to keep it global (visible to every student).
        </p>
      </div>

      {batchOptions.length === 0 ? (
        <div className="rounded-3xl border border-dashed bg-white p-8 text-center">
          <p className="text-sm text-slate-600">
            No batches exist yet. Create batches first from the Batches section.
          </p>
        </div>
      ) : (
        <div className="rounded-3xl border bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">
            Available Batches
          </h3>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {batchOptions.map((batch) => {
              const selected = selectedBatchIds.includes(batch.id);

              return (
                <label
                  key={batch.id}
                  className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition ${
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
                    <h4 className="font-semibold text-slate-900">
                      {batch.title}
                    </h4>
                    <p className="mt-1 text-sm text-slate-600">
                      {batch.examType} · {batch.status} ·{" "}
                      {batch.isPaid ? "Paid" : "Free"}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      Slug: {batch.slug}
                    </p>
                  </div>
                </label>
              );
            })}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={saving}
              className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:bg-slate-400"
            >
              {saving ? "Saving..." : "Save Batch Assignment"}
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedBatchIds([]);
                setSuccessMessage(null);
              }}
              disabled={saving || selectedBatchIds.length === 0}
              className="rounded-xl border px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
            >
              Clear All (Make Global)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}