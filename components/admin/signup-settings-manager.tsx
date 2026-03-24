"use client";

import { useEffect, useMemo, useState } from "react";

type SignupSettingsConfig = {
  otpLength: 4;
  otpExpiryMinutes: number;
  resendCooldownSeconds: number;
  resendLimit: number;
  resendWindowMinutes: number;
  resendBlockMinutes: number;
  wrongAttemptLimit: number;
  wrongAttemptBlockMinutes: number;
  pendingLifetimeHours: number;
  allowEmailOtpOnly: true;
  requireMobileNumber: true;
  loginIdentifierMode: "EMAIL_OR_MOBILE";
  marketingEmailsOptInDefault: boolean;
  turnstileSuspiciousAttemptThreshold: number;
  signupReviewMessage: string;
  oneAccountWarningText: string;
};

type SignupSettingsVersion = {
  id: string;
  versionNumber: number;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  title: string;
  summary?: string | null;
  settings: SignupSettingsConfig;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data?: T;
};

function formatDate(value?: string | null) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function SignupSettingsManager() {
  const [versions, setVersions] = useState<SignupSettingsVersion[]>([]);
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [settings, setSettings] = useState<SignupSettingsConfig | null>(null);

  const [latestPublishedVersionId, setLatestPublishedVersionId] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingDraft, setIsCreatingDraft] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isPublishingDraft, setIsPublishingDraft] = useState(false);
  const [restoringVersionId, setRestoringVersionId] = useState<string | null>(null);

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  async function loadData() {
    try {
      setIsLoading(true);
      setErrorMessage("");

      const response = await fetch("/api/admin/signup-settings", {
        method: "GET",
        cache: "no-store",
      });

      const result = (await response.json()) as ApiResponse<{
        latestPublishedVersionId: string | null;
        latestPublishedVersionNumber: number | null;
        draftVersionId: string | null;
        versions: SignupSettingsVersion[];
      }>;

      if (!response.ok || !result.success || !result.data) {
        throw new Error(result.message || "Failed to load signup settings");
      }

      setVersions(result.data.versions);
      setLatestPublishedVersionId(result.data.latestPublishedVersionId);

      const draft = result.data.versions.find((item) => item.status === "DRAFT") ?? null;
      const selected =
        draft ??
        result.data.versions.find((item) => item.id === result.data?.latestPublishedVersionId) ??
        result.data.versions[0] ??
        null;

      setSelectedVersionId(selected?.id ?? null);

      if (draft) {
        setTitle(draft.title);
        setSummary(draft.summary ?? "");
        setSettings(draft.settings);
      } else {
        setTitle("");
        setSummary("");
        setSettings(null);
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to load signup settings");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const draftVersion = useMemo(
    () => versions.find((item) => item.status === "DRAFT") ?? null,
    [versions]
  );

  const selectedVersion = useMemo(
    () => versions.find((item) => item.id === selectedVersionId) ?? null,
    [versions, selectedVersionId]
  );

  function updateSetting<K extends keyof SignupSettingsConfig>(
    key: K,
    value: SignupSettingsConfig[K]
  ) {
    setSettings((previous) => {
      if (!previous) return previous;
      return {
        ...previous,
        [key]: value,
      };
    });
  }

  async function handleCreateDraft() {
    try {
      setIsCreatingDraft(true);
      setErrorMessage("");
      setSuccessMessage("");

      const response = await fetch("/api/admin/signup-settings/draft", {
        method: "POST",
      });

      const result = (await response.json()) as ApiResponse<{ version: SignupSettingsVersion }>;

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to create draft");
      }

      setSuccessMessage("Signup settings draft created successfully");
      await loadData();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to create draft");
    } finally {
      setIsCreatingDraft(false);
    }
  }

  async function handleSaveDraft() {
    if (!draftVersion || !settings) return;

    try {
      setIsSavingDraft(true);
      setErrorMessage("");
      setSuccessMessage("");

      const response = await fetch(`/api/admin/signup-settings/versions/${draftVersion.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          summary,
          settings,
        }),
      });

      const result = (await response.json()) as ApiResponse<{ version: SignupSettingsVersion }>;

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to save draft");
      }

      setSuccessMessage("Signup settings draft saved successfully");
      await loadData();
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
        `/api/admin/signup-settings/versions/${draftVersion.id}/publish`,
        { method: "POST" }
      );

      const result = (await response.json()) as ApiResponse<{ version: SignupSettingsVersion }>;

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to publish draft");
      }

      setSuccessMessage("Signup settings draft published successfully");
      await loadData();
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
        `/api/admin/signup-settings/versions/${versionId}/restore`,
        { method: "POST" }
      );

      const result = (await response.json()) as ApiResponse<{
        version: SignupSettingsVersion;
        restoredFromVersionNumber: number;
      }>;

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to restore version");
      }

      setSuccessMessage(
        `Version ${result.data?.restoredFromVersionNumber ?? ""} restored as new published version`
      );
      await loadData();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to restore version");
    } finally {
      setRestoringVersionId(null);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
      <aside className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">
            Signup settings versions
          </p>
          <h2 className="mt-2 text-xl font-bold text-slate-900">Version History</h2>
        </div>

        {!draftVersion ? (
          <button
            type="button"
            onClick={handleCreateDraft}
            disabled={isCreatingDraft}
            className="mb-4 w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isCreatingDraft ? "Creating Draft..." : "Create Draft"}
          </button>
        ) : null}

        {isLoading ? (
          <p className="text-sm text-slate-500">Loading versions...</p>
        ) : (
          <div className="space-y-3">
            {versions.map((version) => (
              <button
                key={version.id}
                type="button"
                onClick={() => setSelectedVersionId(version.id)}
                className={`w-full rounded-2xl border p-4 text-left transition ${
                  selectedVersionId === version.id
                    ? "border-blue-500 bg-blue-50"
                    : "border-slate-200 bg-white hover:bg-slate-50"
                }`}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-slate-900">
                    Version {version.versionNumber}
                  </p>
                  <span
                    className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
                      version.status === "DRAFT"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-emerald-100 text-emerald-700"
                    }`}
                  >
                    {version.status}
                  </span>
                </div>

                <p className="mt-2 text-sm text-slate-700">{version.title}</p>
                <p className="mt-2 text-xs text-slate-500">
                  Published: {formatDate(version.publishedAt)}
                </p>
              </button>
            ))}
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

        {selectedVersion ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">
                  Signup settings
                </p>
                <h1 className="mt-2 text-2xl font-bold text-slate-900">
                  Version {selectedVersion.versionNumber} — {selectedVersion.title}
                </h1>
                <p className="mt-2 text-sm text-slate-600">
                  {selectedVersion.summary || "No summary added yet."}
                </p>
              </div>

              {selectedVersion.status !== "DRAFT" ? (
                <button
                  type="button"
                  onClick={() => handleRestoreVersion(selectedVersion.id)}
                  disabled={restoringVersionId === selectedVersion.id}
                  className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {restoringVersionId === selectedVersion.id
                    ? "Restoring..."
                    : "Restore as New Published"}
                </button>
              ) : null}
            </div>

            <div className="mt-5 grid gap-4 text-sm text-slate-600 sm:grid-cols-2">
              <p>Created: {formatDate(selectedVersion.createdAt)}</p>
              <p>Updated: {formatDate(selectedVersion.updatedAt)}</p>
              <p>Published: {formatDate(selectedVersion.publishedAt)}</p>
              <p>
                Latest published:{" "}
                {latestPublishedVersionId === selectedVersion.id ? "Yes" : "No"}
              </p>
            </div>
          </div>
        ) : null}

        {draftVersion && settings ? (
          <>
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-600">
                  Draft editor
                </p>
                <h2 className="mt-2 text-xl font-bold text-slate-900">
                  Edit Draft Version {draftVersion.versionNumber}
                </h2>
              </div>

              <div className="grid gap-5">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Title</label>
                  <input
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Summary</label>
                  <textarea
                    value={summary}
                    onChange={(event) => setSummary(event.target.value)}
                    rows={4}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500"
                  />
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      OTP Expiry (minutes)
                    </label>
                    <input
                      type="number"
                      value={settings.otpExpiryMinutes}
                      onChange={(event) =>
                        updateSetting("otpExpiryMinutes", Number(event.target.value))
                      }
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Resend Cooldown (seconds)
                    </label>
                    <input
                      type="number"
                      value={settings.resendCooldownSeconds}
                      onChange={(event) =>
                        updateSetting("resendCooldownSeconds", Number(event.target.value))
                      }
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Max Resends
                    </label>
                    <input
                      type="number"
                      value={settings.resendLimit}
                      onChange={(event) =>
                        updateSetting("resendLimit", Number(event.target.value))
                      }
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Resend Window (minutes)
                    </label>
                    <input
                      type="number"
                      value={settings.resendWindowMinutes}
                      onChange={(event) =>
                        updateSetting("resendWindowMinutes", Number(event.target.value))
                      }
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Resend Block (minutes)
                    </label>
                    <input
                      type="number"
                      value={settings.resendBlockMinutes}
                      onChange={(event) =>
                        updateSetting("resendBlockMinutes", Number(event.target.value))
                      }
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Wrong Attempt Limit
                    </label>
                    <input
                      type="number"
                      value={settings.wrongAttemptLimit}
                      onChange={(event) =>
                        updateSetting("wrongAttemptLimit", Number(event.target.value))
                      }
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Wrong Attempt Block (minutes)
                    </label>
                    <input
                      type="number"
                      value={settings.wrongAttemptBlockMinutes}
                      onChange={(event) =>
                        updateSetting("wrongAttemptBlockMinutes", Number(event.target.value))
                      }
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Pending Signup Lifetime (hours)
                    </label>
                    <input
                      type="number"
                      value={settings.pendingLifetimeHours}
                      onChange={(event) =>
                        updateSetting("pendingLifetimeHours", Number(event.target.value))
                      }
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Turnstile Suspicious Threshold
                    </label>
                    <input
                      type="number"
                      value={settings.turnstileSuspiciousAttemptThreshold}
                      onChange={(event) =>
                        updateSetting("turnstileSuspiciousAttemptThreshold", Number(event.target.value))
                      }
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-medium text-slate-900">Fixed rules in current batch</p>
                  <ul className="mt-2 space-y-2 text-sm text-slate-600">
                    <li>• OTP length is fixed to 4 in the current implementation</li>
                    <li>• Email OTP only remains enabled</li>
                    <li>• Mobile remains mandatory</li>
                    <li>• Login remains Email or Mobile Number</li>
                  </ul>
                </div>

                <label className="flex items-start gap-3 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={settings.marketingEmailsOptInDefault}
                    onChange={(event) =>
                      updateSetting("marketingEmailsOptInDefault", event.target.checked)
                    }
                    className="mt-1 h-4 w-4 rounded border-slate-300"
                  />
                  <span>Optional future updates email checkbox default checked</span>
                </label>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Signup Review Message
                  </label>
                  <textarea
                    value={settings.signupReviewMessage}
                    onChange={(event) =>
                      updateSetting("signupReviewMessage", event.target.value)
                    }
                    rows={3}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    One Account Warning Text
                  </label>
                  <textarea
                    value={settings.oneAccountWarningText}
                    onChange={(event) =>
                      updateSetting("oneAccountWarningText", event.target.value)
                    }
                    rows={3}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500"
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

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">
                  Admin-only preview
                </p>
                <h2 className="mt-2 text-xl font-bold text-slate-900">Preview Before Publish</h2>
              </div>

              <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-lg font-semibold text-slate-900">{title || "Signup Settings"}</p>
                <p className="text-sm text-slate-600">{summary || "No summary added yet."}</p>

                <div className="grid gap-3 text-sm text-slate-700 md:grid-cols-2">
                  <p>OTP valid for: <strong>{settings.otpExpiryMinutes} minutes</strong></p>
                  <p>Resend after: <strong>{settings.resendCooldownSeconds} seconds</strong></p>
                  <p>Max resends: <strong>{settings.resendLimit}</strong></p>
                  <p>Resend window: <strong>{settings.resendWindowMinutes} minutes</strong></p>
                  <p>Resend block: <strong>{settings.resendBlockMinutes} minutes</strong></p>
                  <p>Wrong OTP limit: <strong>{settings.wrongAttemptLimit}</strong></p>
                  <p>Wrong OTP block: <strong>{settings.wrongAttemptBlockMinutes} minutes</strong></p>
                  <p>Pending signup life: <strong>{settings.pendingLifetimeHours} hours</strong></p>
                  <p>Turnstile threshold: <strong>{settings.turnstileSuspiciousAttemptThreshold}</strong></p>
                  <p>
                    Marketing emails default:{" "}
                    <strong>{settings.marketingEmailsOptInDefault ? "Checked" : "Unchecked"}</strong>
                  </p>
                </div>

                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                  <p className="text-sm text-amber-900">{settings.signupReviewMessage}</p>
                  <p className="mt-2 text-sm font-medium text-amber-900">
                    {settings.oneAccountWarningText}
                  </p>
                </div>
              </div>
            </div>
          </>
        ) : null}
      </section>
    </div>
  );
}