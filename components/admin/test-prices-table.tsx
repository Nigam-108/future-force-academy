"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type TestItem = {
  testBatchId: string;
  testId: string;
  price: number | null;
  priceFormatted: string;
  isFree: boolean;
  test: {
    id: string;
    title: string;
    slug: string;
    mode: string;
    visibilityStatus: string;
    totalQuestions: number;
    totalMarks: number;
    durationInMinutes: number | null;
  };
};

type Props = {
  batchId: string;
  tests: TestItem[];
};

type ApiResponse = {
  success: boolean;
  message: string;
};

type PriceMap = { [testId: string]: string };
type MessageInfo = { type: "success" | "error"; text: string };
type MessageMap = { [testId: string]: MessageInfo };
type BusyMap = { [testId: string]: boolean };

function paiseToBatches(paise: number | null): string {
  if (paise == null || paise === 0) return "";
  return String(paise / 100);
}

function rupeeStringToPaise(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const num = parseFloat(trimmed);
  if (isNaN(num) || num < 0) return null;
  return Math.round(num * 100);
}

function modeBadgeClass(mode: string): string {
  switch (mode) {
    case "LIVE":
      return "bg-rose-50 text-rose-700";
    case "PRACTICE":
      return "bg-violet-50 text-violet-700";
    case "ASSIGNED":
      return "bg-indigo-50 text-indigo-700";
    default:
      return "bg-slate-100 text-slate-600";
  }
}

function visibilityBadgeClass(status: string): string {
  switch (status) {
    case "LIVE":
      return "bg-emerald-50 text-emerald-700";
    case "DRAFT":
      return "bg-amber-50 text-amber-700";
    default:
      return "bg-slate-100 text-slate-600";
  }
}

// Build initial price map outside component to avoid TSX generic ambiguity
function buildInitialPrices(tests: TestItem[]): PriceMap {
  const map: PriceMap = {};
  for (const t of tests) {
    map[t.testId] = paiseToBatches(t.price);
  }
  return map;
}

export function TestPricesTable({ batchId, tests }: Props) {
  const router = useRouter();

  const [prices, setPrices] = useState<PriceMap>(
    buildInitialPrices(tests)
  );

  const [saving, setSaving] = useState<BusyMap>({});
  const [messages, setMessages] = useState<MessageMap>({});

  function setPrice(testId: string, value: string) {
    setPrices((prev: PriceMap) => ({ ...prev, [testId]: value }));
  }

  function setSavingForTest(testId: string, value: boolean) {
    setSaving((prev: BusyMap) => ({ ...prev, [testId]: value }));
  }

  function setMessageForTest(testId: string, msg: MessageInfo | null) {
    setMessages((prev: MessageMap) => {
      const next = { ...prev };
      if (msg === null) {
        delete next[testId];
      } else {
        next[testId] = msg;
      }
      return next;
    });
  }

  async function handleSaveTestPrice(testId: string) {
    setSavingForTest(testId, true);
    setMessageForTest(testId, null);

    const priceValue = prices[testId] ?? "";
    const pricePaise = rupeeStringToPaise(priceValue);

    if (priceValue.trim() && pricePaise === null) {
      setMessageForTest(testId, {
        type: "error",
        text: "Invalid price value",
      });
      setSavingForTest(testId, false);
      return;
    }

    try {
      const response = await fetch(
        `/api/admin/batches/${batchId}/tests/${testId}/price`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ price: pricePaise }),
        }
      );

      const json = (await response.json()) as ApiResponse;

      if (!response.ok || !json.success) {
        throw new Error(json.message || "Failed to save");
      }

      setMessageForTest(testId, {
        type: "success",
        text:
          pricePaise && pricePaise > 0
            ? `Saved ₹${(pricePaise / 100).toFixed(0)}`
            : "Set to free",
      });

      router.refresh();
    } catch (err) {
      setMessageForTest(testId, {
        type: "error",
        text: err instanceof Error ? err.message : "Failed to save",
      });
    } finally {
      setSavingForTest(testId, false);
    }
  }

  async function handleSaveAll() {
    await Promise.allSettled(
      tests.map((t) => handleSaveTestPrice(t.testId))
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => void handleSaveAll()}
          className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
        >
          Save All Test Prices
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Test
              </th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Mode
              </th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Questions
              </th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Price (₹)
              </th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Status
              </th>
              <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                Action
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 bg-white">
            {tests.map((item) => {
              const msg = messages[item.testId];
              const isSaving = saving[item.testId] === true;
              const currentPrice = prices[item.testId] ?? "";

              return (
                <tr key={item.testId} className="hover:bg-slate-50">
                  <td className="px-5 py-4">
                    <p className="font-medium text-slate-900">
                      {item.test.title}
                    </p>
                    <p className="text-xs text-slate-400">
                      {item.test.totalMarks} marks ·{" "}
                      {item.test.durationInMinutes ?? "—"} min
                    </p>
                  </td>

                  <td className="px-5 py-4">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${modeBadgeClass(
                        item.test.mode
                      )}`}
                    >
                      {item.test.mode}
                    </span>
                  </td>

                  <td className="px-5 py-4 text-sm text-slate-700">
                    {item.test.totalQuestions}
                  </td>

                  <td className="px-5 py-4">
                    <div className="relative w-32">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                        ₹
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={currentPrice}
                        onChange={(e) =>
                          setPrice(item.testId, e.target.value)
                        }
                        placeholder="Free"
                        className="w-full rounded-xl border py-2 pl-7 pr-3 text-sm"
                      />
                    </div>
                    {msg ? (
                      <p
                        className={`mt-1 text-xs ${
                          msg.type === "success"
                            ? "text-emerald-600"
                            : "text-rose-600"
                        }`}
                      >
                        {msg.text}
                      </p>
                    ) : null}
                  </td>

                  <td className="px-5 py-4">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${visibilityBadgeClass(
                        item.test.visibilityStatus
                      )}`}
                    >
                      {item.test.visibilityStatus}
                    </span>
                  </td>

                  <td className="px-5 py-4 text-right">
                    <button
                      type="button"
                      onClick={() => void handleSaveTestPrice(item.testId)}
                      disabled={isSaving}
                      className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                    >
                      {isSaving ? "Saving..." : "Save"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-slate-400">
        💡 Leave price blank to make a test free within this batch.
      </p>
    </div>
  );
}