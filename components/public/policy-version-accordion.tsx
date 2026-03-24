"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

type PolicyVersionItem = {
  id: string;
  versionNumber: number;
  title: string;
  summary?: string | null;
  publishedAt?: string | Date | null;
  route: string;
};

type PolicyVersionAccordionProps = {
  title: string;
  versions: PolicyVersionItem[];
  activeVersionId?: string;
};

function formatDate(value?: string | Date | null) {
  if (!value) return "—";
  const date = new Date(value);
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function PolicyVersionAccordion({
  title,
  versions,
  activeVersionId,
}: PolicyVersionAccordionProps) {
  const [openId, setOpenId] = useState<string | null>(activeVersionId ?? null);

  const safeVersions = useMemo(() => versions ?? [], [versions]);

  if (!safeVersions.length) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
        No older published versions available yet.
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-5 py-4">
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        <p className="mt-1 text-sm text-slate-600">
          Open any older published version below.
        </p>
      </div>

      <div className="divide-y divide-slate-200">
        {safeVersions.map((version) => {
          const isOpen = openId === version.id;

          return (
            <div key={version.id}>
              <button
                type="button"
                onClick={() => setOpenId(isOpen ? null : version.id)}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-slate-50"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    Version {version.versionNumber} — {version.title}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Published: {formatDate(version.publishedAt)}
                  </p>
                </div>
                <span className="text-sm font-medium text-blue-600">
                  {isOpen ? "Hide" : "View"}
                </span>
              </button>

              {isOpen ? (
                <div className="bg-slate-50 px-5 pb-5 pt-0">
                  {version.summary ? (
                    <div className="mb-4 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
                      {version.summary}
                    </div>
                  ) : null}

                  <div className="flex flex-wrap gap-3">
                    <Link
                      href={`${version.route}?versionId=${version.id}`}
                      className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
                    >
                      Open This Version
                    </Link>

                    <Link
                      href={`${version.route}?versionId=${version.id}&updated=1`}
                      className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                    >
                      Open with Update Highlight
                    </Link>
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}