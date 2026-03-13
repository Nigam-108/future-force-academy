import { ok } from "@/server/utils/api-response";

export async function GET() {
  return ok("API is healthy", {
    uptime: true,
    timestamp: new Date().toISOString(),
  });
}
