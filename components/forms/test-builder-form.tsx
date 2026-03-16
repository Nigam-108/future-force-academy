"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type TestMode = "PRACTICE" | "LIVE" | "ASSIGNED";
type TestStructureType = "SINGLE" | "SECTIONAL";
type TestVisibilityStatus = "DRAFT" | "LIVE" | "CLOSED";

type TestBuilderFormProps = {
  mode?: "create" | "edit-placeholder";
};

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T | null;
  errors?: unknown;
};

const TEST_MODES: TestMode[] = ["PRACTICE", "LIVE", "ASSIGNED"];
const STRUCTURES: TestStructureType[] = ["SINGLE", "SECTIONAL"];
const VISIBILITIES: TestVisibilityStatus[] = ["DRAFT", "LIVE", "CLOSED"];

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function TestBuilderForm({
  mode = "create",
}: TestBuilderFormProps) {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [testMode, setTestMode] = useState<TestMode>("PRACTICE");
  const [structureType, setStructureType] =
    useState<TestStructureType>("SINGLE");
  const [visibilityStatus, setVisibilityStatus] =
    useState<TestVisibilityStatus>("DRAFT");
  const [totalQuestions, setTotalQuestions] = useState("0");
  const [totalMarks, setTotalMarks] = useState("0");
  const [durationInMinutes, setDurationInMinutes] = useState("");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (mode !== "create") {
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    try {
      const finalSlug = slug.trim() || slugify(title);

      const payload = {
        title: title.trim(),
        slug: finalSlug,
        description: description.trim() || undefined,
        mode: testMode,
        structureType,
        visibilityStatus,
        totalQuestions: Number(totalQuestions || 0),
        totalMarks: Number(totalMarks || 0),
        durationInMinutes: durationInMinutes.trim()
          ? Number(durationInMinutes)
          : undefined,
        startAt: startAt ? new Date(startAt).toISOString() : undefined,
        endAt: endAt ? new Date(endAt).toISOString() : undefined,
      };

      const response = await fetch("/api/admin/tests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      const json = (await response.json().catch(() => null)) as ApiResponse<{
        id: string;
      }> | null;

      if (!response.ok || !json?.success) {
        throw new Error(json?.message || "Failed to create test.");
      }

      router.push("/admin/tests");
      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to create test."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errorMessage ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {errorMessage}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <input
          value={title}
          onChange={(e) => {
            const nextTitle = e.target.value;
            setTitle(nextTitle);
            if (!slug.trim()) {
              setSlug(slugify(nextTitle));
            }
          }}
          className="rounded-xl border px-4 py-3"
          placeholder="Test title"
          required
        />

        <input
          value={slug}
          onChange={(e) => setSlug(slugify(e.target.value))}
          className="rounded-xl border px-4 py-3"
          placeholder="Slug"
          required
        />
      </div>

      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="min-h-28 w-full rounded-xl border px-4 py-3"
        placeholder="Test description"
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <select
          value={testMode}
          onChange={(e) => setTestMode(e.target.value as TestMode)}
          className="rounded-xl border px-4 py-3"
        >
          {TEST_MODES.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        <select
          value={structureType}
          onChange={(e) =>
            setStructureType(e.target.value as TestStructureType)
          }
          className="rounded-xl border px-4 py-3"
        >
          {STRUCTURES.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        <select
          value={visibilityStatus}
          onChange={(e) =>
            setVisibilityStatus(e.target.value as TestVisibilityStatus)
          }
          className="rounded-xl border px-4 py-3"
        >
          {VISIBILITIES.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <input
          type="number"
          min="0"
          value={totalQuestions}
          onChange={(e) => setTotalQuestions(e.target.value)}
          className="rounded-xl border px-4 py-3"
          placeholder="Total Questions"
        />

        <input
          type="number"
          min="0"
          value={totalMarks}
          onChange={(e) => setTotalMarks(e.target.value)}
          className="rounded-xl border px-4 py-3"
          placeholder="Total Marks"
        />

        <input
          type="number"
          min="1"
          value={durationInMinutes}
          onChange={(e) => setDurationInMinutes(e.target.value)}
          className="rounded-xl border px-4 py-3"
          placeholder="Duration in minutes"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">
            Start At
          </label>
          <input
            type="datetime-local"
            value={startAt}
            onChange={(e) => setStartAt(e.target.value)}
            className="w-full rounded-xl border px-4 py-3"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">
            End At
          </label>
          <input
            type="datetime-local"
            value={endAt}
            onChange={(e) => setEndAt(e.target.value)}
            className="w-full rounded-xl border px-4 py-3"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={submitting || mode !== "create"}
          className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {submitting ? "Saving..." : "Create Test"}
        </button>

        <button
          type="button"
          onClick={() => router.push("/admin/tests")}
          className="rounded-xl border px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}