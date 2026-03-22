import { getRanksForStudentTest } from "@/server/repositories/rank.repository";

export async function getStudentTestRanks(userId: string, testId: string) {
  return getRanksForStudentTest(userId, testId);
}