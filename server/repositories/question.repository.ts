import {
  Prisma,
  QuestionStatus,
  QuestionType,
  DifficultyLevel,
} from "@prisma/client";
import { prisma } from "@/server/db/prisma";

export async function createQuestionRecord(data: {
  createdById: string;
  type: QuestionType;
  difficulty: DifficultyLevel;
  status: QuestionStatus;
  questionText: string;
  optionA?: string;
  optionB?: string;
  optionC?: string;
  optionD?: string;
  correctAnswer?: string;
  explanation?: string;
  tags: string[];
}) {
  return prisma.question.create({
    data,
    include: {
      createdBy: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
    },
  });
}

export async function listQuestionRecords(filters: {
  page: number;
  limit: number;
  search?: string;
  type?: QuestionType;
  difficulty?: DifficultyLevel;
  status?: QuestionStatus;
}) {
  const where: Prisma.QuestionWhereInput = {
    ...(filters.search
      ? {
          OR: [
            { questionText: { contains: filters.search, mode: "insensitive" } },
            { explanation: { contains: filters.search, mode: "insensitive" } },
            { tags: { has: filters.search } },
          ],
        }
      : {}),
    ...(filters.type ? { type: filters.type } : {}),
    ...(filters.difficulty ? { difficulty: filters.difficulty } : {}),
    ...(filters.status ? { status: filters.status } : {}),
  };

  const skip = (filters.page - 1) * filters.limit;

  const [items, total] = await Promise.all([
    prisma.question.findMany({
      where,
      skip,
      take: filters.limit,
      orderBy: { createdAt: "desc" },
      include: {
        createdBy: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        approvedBy: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    }),
    prisma.question.count({ where }),
  ]);

  return {
    items,
    total,
    page: filters.page,
    limit: filters.limit,
    totalPages: Math.ceil(total / filters.limit),
  };
}
