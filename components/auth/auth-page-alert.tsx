type AuthPageAlertProps = {
  tone?: "info" | "success" | "warning" | "error";
  message: string;
};

export function AuthPageAlert({
  tone = "info",
  message,
}: AuthPageAlertProps) {
  const styles =
    tone === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : tone === "warning"
      ? "border-amber-200 bg-amber-50 text-amber-800"
      : tone === "error"
      ? "border-red-200 bg-red-50 text-red-700"
      : "border-blue-200 bg-blue-50 text-blue-700";

  return (
    <div className={`rounded-2xl border px-4 py-3 text-sm ${styles}`}>
      {message}
    </div>
  );
}
