import { expireOverduePurchases } from "@/server/services/payment.service";

async function main() {
  const result = await expireOverduePurchases();

  console.log("Expiry job completed.");
  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error("Expiry job failed:", error);
  process.exit(1);
});
