import { NextRequest, NextResponse } from "next/server";
import {
  processWebhookEvent,
  verifyWebhookSignature,
} from "@/server/services/razorpay.service";

/**
 * Razorpay Webhook Handler
 *
 * Setup in Razorpay Dashboard:
 * Webhook URL: https://yourdomain.com/api/webhooks/razorpay
 * Events to subscribe:
 *   - payment.captured
 *   - payment.failed
 *   - refund.created
 *
 * IMPORTANT:
 * - This route must NOT use requireAuth (Razorpay calls it server-to-server)
 * - Must verify signature before processing
 * - Must return 200 quickly — Razorpay retries on non-200
 */
export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-razorpay-signature") ?? "";

    // Verify webhook signature first
    const isValid = verifyWebhookSignature(rawBody, signature);

    if (!isValid) {
      console.error("[Webhook] Invalid Razorpay signature");
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 400 }
      );
    }

    // Parse the event
    let event;
    try {
      event = JSON.parse(rawBody);
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    console.log(`[Webhook] Received event: ${event.event}`);

    // Process the event asynchronously
    await processWebhookEvent(event);

    // Always return 200 to Razorpay
    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error("[Webhook] Error processing event:", error);

    // Still return 200 to prevent Razorpay retries for non-recoverable errors
    return NextResponse.json({ received: true }, { status: 200 });
  }
}