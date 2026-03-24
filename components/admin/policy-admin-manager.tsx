"use client";

import { useEffect, useMemo, useState } from "react";

type PolicyDocumentSummary = {
  id: string;
  type: "TERMS" | "PRIVACY" | "REFUND_CANCELLATION";
  slug: string;
  title: string;
  description?: string | null;
  totalVersions: number;
  latestPublishedVersionNumber: number | null;
  latestPublishedVersionId: string | null;
  draftVersionNumber: number | null;
  draftVersionId: string | null;
};

type PolicyVersionItem = {
  id: string;
  versionNumber: number;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  title: string;
  summary?: string | null;
  contentMarkdown: string;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

type PolicyDetailResponseData = {
  document: {
    id: string;
    type: "TERMS" | "PRIVACY" | "REFUND_CANCELLATION";
    slug: string;
    title: string;
    description?: string | null;
  };
  latestPublishedVersionId: string | null;
  latestPublishedVersionNumber: number | null;
  draftVersionId: string | null;
  versions: PolicyVersionItem[];
};

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data?: T;
};

function typeToRouteParam(type: PolicyDocumentSummary["type"] | PolicyDetailResponseData["document"]["type"]) {
  switch (type) {
    case "TERMS":
      return "terms";
    case "PRIVACY":
      return "privacy";
    case "REFUND_CANCELLATION":
      return "refund-cancellation";
    default:
      return "terms";
  }
}

function formatDate(value?: string | null) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function PolicyAdminManager() {
  const [documents, setDocuments] = useState<PolicyDocumentSummary[]>([]);
  const [selectedType, setSelectedType] = useState<PolicyDocumentSummary["type"] | null>(null);
  const [detail, setDetail] = useState<PolicyDetailResponseData | null>(null);
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [contentMarkdown, setContentMarkdown] = useState("");

  const [isLoadingList, setIsLoadingList] = useState(true);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [isCreatingDraft, setIsCreatingDraft] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isPublishingDraft, setIsPublishingDraft] = useState(false);
  const [restoringVersionId, setRestoringVersionId] = useState<string | null>(null);

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    let active = true;

    async function loadList() {
      try {
        setIsLoadingList(true);
        setErrorMessage("");

        const response = await fetch("/api/admin/policies", {
          method: "GET",
          cache: "no-store",
        });

        const result = (await response.json()) as ApiResponse<{ documents: PolicyDocumentSummary[] }>;

        if (!response.ok || !result.success || !result.data) {
          throw new Error(result.message || "Failed to load policy list");
        }

        if (!active) return;

        setDocuments(result.data.documents);

        if (!selectedType && result.data.documents.length > 0) {
          setSelectedType(result.data.documents[0].type);
        }
      } catch (error) {
        if (!active) return;
        setErrorMessage(error instanceof Error ? error.message : "Failed to load policy list");
      } finally {
        if (active) {
          setIsLoadingList(false);
        }
      }
    }

    loadList();

    return () => {
      active = false;
    };
  }, [selectedType]);

  async function loadPolicyDetail(type: PolicyDocumentSummary["type"]) {
    try {
      setIsLoadingDetail(true);
      setErrorMessage("");
      setSuccessMessage("");

      const response = await fetch(`/api/admin/policies/${typeToRouteParam(type)}`, {
        method: "GET",
        cache: "no-store",
      });

      const result = (await response.json()) as ApiResponse<PolicyDetailResponseData>;

      if (!response.ok || !result.success || !result.data) {
        throw new Error(result.message || "Failed to load policy detail");
      }

      const nextDetail = result.data;
      setDetail(nextDetail);

      const draft = nextDetail.versions.find((item) => item.status === "DRAFT") ?? null;
      const selected =
        draft ??
        nextDetail.versions.find((item) => item.id === nextDetail.latestPublishedVersionId) ??
        nextDetail.versions[0] ??
        null;

      setSelectedVersionId(selected?.id ?? null);
      setTitle(draft?.title ?? "");
      setSummary(draft?.summary ?? "");
      setContentMarkdown(draft?.contentMarkdown ?? "");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to load policy detail");
    } finally {
      setIsLoadingDetail(false);
    }
  }

  useEffect(() => {
    if (!selectedType) return;
    loadPolicyDetail(selectedType);
  }, [selectedType]);

  const selectedVersion = useMemo(() => {
    if (!detail || !selectedVersionId) return null;
    return detail.versions.find((item) => item.id === selectedVersionId) ?? null;
  }, [detail, selectedVersionId]);

  const draftVersion = useMemo(() => {
    return detail?.versions.find((item) => item.status === "DRAFT") ?? null;
  }, [detail]);

  async function refreshAll() {
    if (selectedType) {
      await loadPolicyDetail(selectedType);
    }

    const listResponse = await fetch("/api/admin/policies", {
      method: "GET",
      cache: "no-store",
    });

    const listResult = (await listResponse.json()) as ApiResponse<{ documents: PolicyDocumentSummary[] }>;

    if (listResponse.ok && listResult.success && listResult.data) {
      setDocuments(listResult.data.documents);
    }
  }

  async function handleCreateDraft() {
    if (!selectedType) return;

    try {
      setIsCreatingDraft(true);
      setErrorMessage("");
      setSuccessMessage("");

      const response = await fetch(
        `/api/admin/policies/${typeToRouteParam(selectedType)}/draft`,
        { method: "POST" }
      );

      const result = (await response.json()) as ApiResponse<{ draft: PolicyVersionItem }>;

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to create draft");
      }

      setSuccessMessage("Draft created successfully");
      await refreshAll();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to create draft");
    } finally {
      setIsCreatingDraft(false);
    }
  }

  async function handleSaveDraft() {
    if (!draftVersion) return;

    try {
      setIsSavingDraft(true);
      setErrorMessage("");
      setSuccessMessage("");

      const response = await fetch(`/api/admin/policies/versions/${draftVersion.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          summary,
          contentMarkdown,
        }),
      });

      const result = (await response.json()) as ApiResponse<{ version: PolicyVersionItem }>;

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to save draft");
      }

      setSuccessMessage("Draft saved successfully");
      await refreshAll();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to save draft");
    } finally {
      setIsSavingDraft(false);
    }
  }

  async function handlePublishDraft() {
    if (!draftVersion) return;

    try {
      setIsPublishingDraft(true);
      setErrorMessage("");
      setSuccessMessage("");

      const response = await fetch(
        `/api/admin/policies/versions/${draftVersion.id}/publish`,
        { method: "POST" }
      );

      const result = (await response.json()) as ApiResponse<{ version: PolicyVersionItem }>;

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to publish draft");
      }

      setSuccessMessage("Draft published successfully");
      await refreshAll();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to publish draft");
    } finally {
      setIsPublishingDraft(false);
    }
  }

  async function handleRestoreVersion(versionId: string) {
    try {
      setRestoringVersionId(versionId);
      setErrorMessage("");
      setSuccessMessage("");

      const response = await fetch(
        `/api/admin/policies/versions/${versionId}/restore`,
        { method: "POST" }
      );

      const result = (await response.json()) as ApiResponse<{
        version: PolicyVersionItem;
        restoredFromVersionId: string;
        restoredFromVersionNumber: number;
      }>;

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to restore version");
      }

      setSuccessMessage(
        `Version ${result.data?.restoredFromVersionNumber ?? ""} restored as a new published version`
      );
      await refreshAll();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to restore version");
    } finally {
      setRestoringVersionId(null);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
      <aside className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">
            Policy documents
          </p>
          <h2 className="mt-2 text-xl font-bold text-slate-900">Manage Policies</h2>
        </div>

        {isLoadingList ? (
          <p className="text-sm text-slate-500">Loading policies...</p>
        ) : (
          <div className="space-y-3">
            {documents.map((doc) => {
              const active = selectedType === doc.type;

              return (
                <button
                  key={doc.id}
                  type="button"
                  onClick={() => setSelectedType(doc.type)}
                  className={`w-full rounded-2xl border p-4 text-left transition ${
                    active
                      ? "border-blue-500 bg-blue-50"
                      : "border-slate-200 bg-white hover:bg-slate-50"
                  }`}
                >
                  <p className="text-sm font-semibold text-slate-900">{doc.title}</p>
                  <div className="mt-2 space-y-1 text-xs text-slate-600">
                    <p>Total versions: {doc.totalVersions}</p>
                    <p>Latest published: {doc.latestPublishedVersionNumber ?? "—"}</p>
                    <p>Draft: {doc.draftVersionNumber ?? "No active draft"}</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </aside>

      <section className="space-y-6">
        {errorMessage ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </div>
        ) : null}

        {successMessage ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {successMessage}
          </div>
        ) : null}

        {isLoadingDetail ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">Loading policy detail...</p>
          </div>
        ) : detail ? (
          <>
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">
                    {detail.document.type}
                  </p>
                  <h1 className="mt-2 text-2xl font-bold text-slate-900">
                    {detail.document.title}
                  </h1>
                  <p className="mt-2 text-sm text-slate-600">
                    {detail.document.description || "No description set yet."}
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  {!draftVersion ? (
                    <button
                      type="button"
                      onClick={handleCreateDraft}
                      disabled={isCreatingDraft}
                      className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {isCreatingDraft ? "Creating Draft..." : "Create Draft"}
                    </button>
                  ) : null}

                  <button
                    type="button"
                    onClick={refreshAll}
                    className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    Refresh
                  </button>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900">Version History</h2>
              <div className="mt-4 grid gap-4">
                {detail.versions.map((version) => (
                  <div
                    key={version.id}
                    className={`rounded-2xl border p-4 ${
                      selectedVersionId === version.id
                        ? "border-blue-500 bg-blue-50"
                        : "border-slate-200 bg-slate-50"
                    }`}
                  >
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-3">
                          <p className="text-sm font-semibold text-slate-900">
                            Version {version.versionNumber} — {version.title}
                          </p>
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              version.status === "DRAFT"
                                ? "bg-amber-100 text-amber-700"
                                : version.status === "PUBLISHED"
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-slate-200 text-slate-700"
                            }`}
                          >
                            {version.status}
                          </span>
                        </div>

                        <div className="mt-2 space-y-1 text-xs text-slate-500">
                          <p>Published: {formatDate(version.publishedAt)}</p>
                          <p>Updated: {formatDate(version.updatedAt)}</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={() => setSelectedVersionId(version.id)}
                          className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                        >
                          View
                        </button>

                        {version.status !== "DRAFT" ? (
                          <button
                            type="button"
                            onClick={() => handleRestoreVersion(version.id)}
                            disabled={restoringVersionId === version.id}
                            className="rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
                          >
                            {restoringVersionId === version.id
                              ? "Restoring..."
                              : "Restore as New Published"}
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {draftVersion ? (
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-600">
                    Draft editor
                  </p>
                  <h2 className="mt-2 text-xl font-bold text-slate-900">
                    Edit Draft Version {draftVersion.versionNumber}
                  </h2>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">Title</label>
                    <input
                      value={title}
                      onChange={(event) => setTitle(event.target.value)}
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500"
                      placeholder="Enter policy title"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Summary of Changes
                    </label>
                    <textarea
                      value={summary}
                      onChange={(event) => setSummary(event.target.value)}
                      rows={4}
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500"
                      placeholder="Write a short user-facing summary of what changed"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Policy Markdown Content
                    </label>
                    <textarea
                      value={contentMarkdown}
                      onChange={(event) => setContentMarkdown(event.target.value)}
                      rows={18}
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 font-mono text-sm outline-none transition focus:border-blue-500"
                      placeholder="Write the policy markdown content here"
                    />
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <button
                      type="button"
                      onClick={handleSaveDraft}
                      disabled={isSavingDraft}
                      className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {isSavingDraft ? "Saving..." : "Save Draft"}
                    </button>

                    <button
                      type="button"
                      onClick={handlePublishDraft}
                      disabled={isPublishingDraft}
                      className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {isPublishingDraft ? "Publishing..." : "Publish Draft"}
                    </button>
                  </div>
                </div>
              </div>
            ) : null}

            {selectedVersion ? (
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">
                    Version preview
                  </p>
                  <h2 className="mt-2 text-xl font-bold text-slate-900">
                    Version {selectedVersion.versionNumber} — {selectedVersion.title}
                  </h2>
                  <p className="mt-2 text-sm text-slate-600">
                    {selectedVersion.summary || "No summary added for this version."}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <pre className="whitespace-pre-wrap break-words text-sm leading-7 text-slate-700">
                    {selectedVersion.contentMarkdown}
                  </pre>
                </div>
              </div>
            ) : null}
          </>
        ) : (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">Select a policy to manage.</p>
          </div>
        )}
      </section>
    </div>
  );
}