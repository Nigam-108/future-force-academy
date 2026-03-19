"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type ApiResponse = {
  success: boolean;
  message: string;
};

type BatchOption = {
  id: string;
  title: string;
  examType: string;
  status: string;
};

type StudentOption = {
  id: string;
  fullName: string;
  email: string;
};

export function ManualEnrollButton() {
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [batches, setBatches] = useState<BatchOption[]>([]);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [notes, setNotes] = useState("");

  async function loadDropdownData() {
    setLoadingData(true);
    try {
      const [batchRes, studentRes] = await Promise.all([
        fetch("/api/admin/batches/options"),
        fetch("/api/admin/students?limit=100"),
      ]);

      const batchJson = await batchRes.json();
      const studentJson = await studentRes.json();

      if (batchJson.success && batchJson.data) {
        setBatches(
          (batchJson.data as BatchOption[]).filter((b) => b.status === "ACTIVE")
        );
      }

      if (studentJson.success && studentJson.data?.items) {
        setStudents(studentJson.data.items as StudentOption[]);
      }
    } catch {
      setErrorMessage("Failed to load data for enrollment.");
    } finally {
      setLoadingData(false);
    }
  }

  function handleOpen() {
    setOpen(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    setSelectedUserId("");
    setSelectedBatchId("");
    setNotes("");
    void loadDropdownData();
  }

  async function handleSubmit() {
    if (!selectedUserId || !selectedBatchId) {
      setErrorMessage("Please select both a student and a batch.");
      return;
    }

    setBusy(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const response = await fetch("/api/admin/purchases", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          userId: selectedUserId,
          batchId: selectedBatchId,
          notes: notes.trim() || undefined,
        }),
      });

      const json = (await response.json()) as ApiResponse;

      if (!response.ok || !json.success) {
        throw new Error(json.message || "Enrollment failed.");
      }

      setSuccessMessage(json.message);
      router.refresh();

      setTimeout(() => {
        setOpen(false);
        setSuccessMessage(null);
      }, 2000);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Enrollment failed."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
      >
        Manual Enroll
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-3xl border bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">
                Manual Enrollment
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-xl border px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>

            {errorMessage ? (
              <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                {errorMessage}
              </div>
            ) : null}

            {successMessage ? (
              <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
                {successMessage}
              </div>
            ) : null}

            {loadingData ? (
              <p className="text-sm text-slate-600">Loading...</p>
            ) : (
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700">
                    Student
                  </label>
                  <select
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    className="w-full rounded-xl border px-4 py-3 text-sm"
                  >
                    <option value="">Select student...</option>
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.fullName} ({s.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700">
                    Batch (Active only)
                  </label>
                  <select
                    value={selectedBatchId}
                    onChange={(e) => setSelectedBatchId(e.target.value)}
                    className="w-full rounded-xl border px-4 py-3 text-sm"
                  >
                    <option value="">Select batch...</option>
                    {batches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.title} ({b.examType})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700">
                    Notes (optional)
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Scholarship, offline payment received..."
                    className="w-full rounded-xl border px-4 py-3 text-sm"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => void handleSubmit()}
                  disabled={busy || !selectedUserId || !selectedBatchId}
                  className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:bg-slate-400"
                >
                  {busy ? "Enrolling..." : "Enroll Student"}
                </button>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}