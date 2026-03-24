import { ContentVersionStatus, PolicyType } from "@prisma/client";
import { AppError } from "@/server/utils/errors";
import {
  createPolicyVersion,
  findAllPolicyDocumentsWithVersions,
  findDraftPolicyVersionByDocumentId,
  findPolicyDocumentWithVersionsByType,
  findPolicyVersionById,
  updatePolicyVersion,
} from "@/server/repositories/admin-policy.repository";

type AdminSessionLike = {
  userId: string;
  role: "ADMIN" | "SUB_ADMIN" | "STUDENT";
};

function assertAdmin(session: AdminSessionLike) {
  if (session.role !== "ADMIN") {
    throw new AppError("Only admin can manage policies", 403);
  }
}

function mapPolicyDocumentSummary(document: Awaited<ReturnType<typeof findAllPolicyDocumentsWithVersions>>[number]) {
  const latestPublished = document.versions.find((item) => item.status === ContentVersionStatus.PUBLISHED) ?? null;
  const draftVersion = document.versions.find((item) => item.status === ContentVersionStatus.DRAFT) ?? null;

  return {
    id: document.id,
    type: document.type,
    slug: document.slug,
    title: document.title,
    description: document.description,
    totalVersions: document.versions.length,
    latestPublishedVersionNumber: latestPublished?.versionNumber ?? null,
    latestPublishedVersionId: latestPublished?.id ?? null,
    draftVersionNumber: draftVersion?.versionNumber ?? null,
    draftVersionId: draftVersion?.id ?? null,
  };
}

function mapPolicyVersion(version: NonNullable<Awaited<ReturnType<typeof findPolicyVersionById>>>) {
  return {
    id: version.id,
    documentId: version.documentId,
    documentType: version.document.type,
    documentTitle: version.document.title,
    versionNumber: version.versionNumber,
    status: version.status,
    title: version.title,
    summary: version.summary,
    contentMarkdown: version.contentMarkdown,
    publishedAt: version.publishedAt,
    createdAt: version.createdAt,
    updatedAt: version.updatedAt,
  };
}

export async function listAdminPolicies(session: AdminSessionLike) {
  assertAdmin(session);

  const documents = await findAllPolicyDocumentsWithVersions();

  return {
    documents: documents.map(mapPolicyDocumentSummary),
  };
}

export async function getAdminPolicyDetail(
  session: AdminSessionLike,
  type: PolicyType
) {
  assertAdmin(session);

  const document = await findPolicyDocumentWithVersionsByType(type);

  if (!document) {
    throw new AppError("Policy document not found", 404);
  }

  const latestPublished =
    document.versions.find((item) => item.status === ContentVersionStatus.PUBLISHED) ?? null;
  const draftVersion =
    document.versions.find((item) => item.status === ContentVersionStatus.DRAFT) ?? null;

  return {
    document: {
      id: document.id,
      type: document.type,
      slug: document.slug,
      title: document.title,
      description: document.description,
    },
    latestPublishedVersionId: latestPublished?.id ?? null,
    latestPublishedVersionNumber: latestPublished?.versionNumber ?? null,
    draftVersionId: draftVersion?.id ?? null,
    versions: document.versions.map((version) => ({
      id: version.id,
      versionNumber: version.versionNumber,
      status: version.status,
      title: version.title,
      summary: version.summary,
      contentMarkdown: version.contentMarkdown,
      publishedAt: version.publishedAt,
      createdAt: version.createdAt,
      updatedAt: version.updatedAt,
    })),
  };
}

export async function createPolicyDraft(
  session: AdminSessionLike,
  type: PolicyType
) {
  assertAdmin(session);

  const document = await findPolicyDocumentWithVersionsByType(type);

  if (!document) {
    throw new AppError("Policy document not found", 404);
  }

  const existingDraft = await findDraftPolicyVersionByDocumentId(document.id);

  if (existingDraft) {
    throw new AppError("A draft already exists for this policy", 409);
  }

  const latestVersionNumber =
    document.versions.reduce((max, item) => Math.max(max, item.versionNumber), 0) || 0;

  const latestPublished =
    document.versions.find((item) => item.status === ContentVersionStatus.PUBLISHED) ?? null;

  const draft = await createPolicyVersion({
    documentId: document.id,
    versionNumber: latestVersionNumber + 1,
    status: ContentVersionStatus.DRAFT,
    title: latestPublished?.title ?? document.title,
    summary: latestPublished?.summary ?? document.description ?? "",
    contentMarkdown:
      latestPublished?.contentMarkdown ??
      `# ${document.title}\n\nWrite the next draft version here.`,
  });

  return {
    draft: mapPolicyVersion(draft),
  };
}

export async function updatePolicyDraft(
  session: AdminSessionLike,
  versionId: string,
  input: {
    title: string;
    summary?: string;
    contentMarkdown: string;
  }
) {
  assertAdmin(session);

  const version = await findPolicyVersionById(versionId);

  if (!version) {
    throw new AppError("Policy version not found", 404);
  }

  if (version.status !== ContentVersionStatus.DRAFT) {
    throw new AppError("Only draft versions can be edited", 409);
  }

  const updated = await updatePolicyVersion(versionId, {
    title: input.title,
    summary: input.summary?.trim() || null,
    contentMarkdown: input.contentMarkdown,
  });

  return {
    version: mapPolicyVersion(updated),
  };
}

export async function publishPolicyDraft(
  session: AdminSessionLike,
  versionId: string
) {
  assertAdmin(session);

  const version = await findPolicyVersionById(versionId);

  if (!version) {
    throw new AppError("Policy version not found", 404);
  }

  if (version.status !== ContentVersionStatus.DRAFT) {
    throw new AppError("Only draft versions can be published", 409);
  }

  const published = await updatePolicyVersion(versionId, {
    status: ContentVersionStatus.PUBLISHED,
    publishedAt: new Date(),
  });

  return {
    version: mapPolicyVersion(published),
  };
}

export async function restorePolicyVersionAsNewPublishedCopy(
  session: AdminSessionLike,
  versionId: string
) {
  assertAdmin(session);

  const sourceVersion = await findPolicyVersionById(versionId);

  if (!sourceVersion) {
    throw new AppError("Policy version not found", 404);
  }

  if (sourceVersion.status === ContentVersionStatus.DRAFT) {
    throw new AppError("Draft version cannot be restored as published copy", 409);
  }

  const document = await findPolicyDocumentWithVersionsByType(sourceVersion.document.type);

  if (!document) {
    throw new AppError("Policy document not found", 404);
  }

  const latestVersionNumber =
    document.versions.reduce((max, item) => Math.max(max, item.versionNumber), 0) || 0;

  const restored = await createPolicyVersion({
    documentId: sourceVersion.documentId,
    versionNumber: latestVersionNumber + 1,
    status: ContentVersionStatus.PUBLISHED,
    title: sourceVersion.title,
    summary: sourceVersion.summary,
    contentMarkdown: sourceVersion.contentMarkdown,
    publishedAt: new Date(),
  });

  return {
    version: mapPolicyVersion(restored),
    restoredFromVersionId: sourceVersion.id,
    restoredFromVersionNumber: sourceVersion.versionNumber,
  };
}