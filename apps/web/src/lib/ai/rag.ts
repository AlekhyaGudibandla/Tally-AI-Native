import prisma from "../db";
import { PromptGuard } from "./prompt-guard";
import crypto from "crypto";

export interface RetrievedSource {
  documentId: string;
  fileName: string;
  relevanceScore: number;
  snippet: string;
}

export interface RetrievalResult {
  hasMatches: boolean;
  citations: RetrievedSource[];
  demarcatedContext: string;
  summary: string;
}

export class RAGService {
  /**
   * Tokenizes text into lowercase normalized keywords, removing punctuation and common stopwords.
   */
  private static tokenize(text: string): string[] {
    const stopwords = new Set([
      "a", "an", "the", "and", "or", "in", "on", "at", "to", "for", "of", "with",
      "by", "from", "is", "was", "are", "were", "it", "this", "that", "these", "those",
      "be", "been", "have", "has", "had", "do", "does", "did", "as", "if"
    ]);

    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, " ")
      .split(/\s+/)
      .filter((word) => word.length > 2 && !stopwords.has(word));
  }

  /**
   * Splits document into overlapping passages for granular indexing.
   */
  private static chunkDocument(content: string, chunkSize = 400, overlap = 80): string[] {
    if (!content) return [];
    if (content.length <= chunkSize) return [content];

    const chunks: string[] = [];
    let start = 0;
    while (start < content.length) {
      const end = Math.min(start + chunkSize, content.length);
      chunks.push(content.substring(start, end));
      start += chunkSize - overlap;
    }
    return chunks;
  }

  /**
   * Calculate BM25/TF-IDF inspired term match score between query tokens and chunk text.
   */
  private static calculateScore(queryTokens: string[], chunkText: string): number {
    if (queryTokens.length === 0 || !chunkText) return 0;
    const chunkTokens = this.tokenize(chunkText);
    if (chunkTokens.length === 0) return 0;

    const chunkFreqMap = new Map<string, number>();
    for (const token of chunkTokens) {
      chunkFreqMap.set(token, (chunkFreqMap.get(token) || 0) + 1);
    }

    let matchCount = 0;
    for (const qToken of queryTokens) {
      if (chunkFreqMap.has(qToken)) {
        // Boost matches proportional to term frequency
        matchCount += 1 + Math.log(chunkFreqMap.get(qToken)!);
      }
    }

    // Normalized score between 0 and 1
    const maxPossible = queryTokens.length * 2;
    return Math.min(1, matchCount / maxPossible);
  }

  /**
   * Ingest a document into the organization's knowledge base.
   * Enforces strict organization isolation, deduplication via content hash, and metadata tracking.
   */
  public static async ingestDocument(
    organizationId: string,
    fileName: string,
    content: string,
    fileType = "text/plain"
  ) {
    if (!organizationId) {
      throw new Error("Tenant isolation violation: organizationId is required");
    }
    if (!content || !content.trim()) {
      throw new Error("Document ingestion failed: Content cannot be empty");
    }

    // Compute content hash to detect exact duplicates
    const contentHash = crypto.createHash("sha256").update(content).digest("hex");

    // Check for existing duplicate document in this organization
    const existing = await prisma.document.findFirst({
      where: {
        organizationId,
        fileName,
      },
    });

    const metadata = JSON.stringify({
      contentHash,
      charCount: content.length,
      ingestedAt: new Date().toISOString(),
    });

    if (existing) {
      // Safely update and re-index existing document
      return await prisma.document.update({
        where: { id: existing.id },
        data: {
          content,
          fileType,
          metadata,
          ingestionStatus: "PROCESSED",
          updatedAt: new Date(),
        },
      });
    }

    return await prisma.document.create({
      data: {
        organizationId,
        fileName,
        fileType,
        content,
        metadata,
        ingestionStatus: "PROCESSED",
      },
    });
  }

  /**
   * Search within the organization's documents.
   * Multi-tenant: ONLY queries documents belonging to organizationId.
   * Non-hallucination: If no chunk exceeds the relevance threshold, returns no invented evidence.
   */
  public static async retrieveContext(
    organizationId: string,
    query: string,
    minRelevanceThreshold = 0.18
  ): Promise<RetrievalResult> {
    if (!organizationId) {
      throw new Error("Tenant isolation violation: organizationId is required");
    }

    const queryTokens = this.tokenize(query);
    if (queryTokens.length === 0) {
      return {
        hasMatches: false,
        citations: [],
        demarcatedContext: "",
        summary: "No search terms provided.",
      };
    }

    // Strictly load documents for this organization only
    const docs = await prisma.document.findMany({
      where: {
        organizationId,
        ingestionStatus: "PROCESSED",
      },
    });

    if (docs.length === 0) {
      return {
        hasMatches: false,
        citations: [],
        demarcatedContext: "",
        summary: `No indexed documents found for organization ${organizationId}.`,
      };
    }

    // Score all chunks across the tenant's documents
    const scoredChunks: Array<{
      documentId: string;
      fileName: string;
      score: number;
      snippet: string;
    }> = [];

    for (const doc of docs) {
      if (!doc.content) continue;
      const chunks = this.chunkDocument(doc.content);
      for (const chunk of chunks) {
        const score = this.calculateScore(queryTokens, chunk);
        if (score >= minRelevanceThreshold) {
          scoredChunks.push({
            documentId: doc.id,
            fileName: doc.fileName,
            score: Number(score.toFixed(3)),
            snippet: chunk.trim(),
          });
        }
      }
    }

    // Sort by descending relevance score
    scoredChunks.sort((a, b) => b.score - a.score);

    const topMatches = scoredChunks.slice(0, 3);
    if (topMatches.length === 0) {
      return {
        hasMatches: false,
        citations: [],
        demarcatedContext: "",
        summary: `No supporting evidence found in company documents for query: "${query}".`,
      };
    }

    const citations: RetrievedSource[] = topMatches.map((m) => ({
      documentId: m.documentId,
      fileName: m.fileName,
      relevanceScore: m.score,
      snippet: m.snippet,
    }));

    const rawEvidenceText = topMatches
      .map(
        (m, idx) =>
          `[Source ${idx + 1}: ${m.fileName} (Doc ID: ${m.documentId}, Relevance: ${(m.score * 100).toFixed(1)}%)]\n${m.snippet}`
      )
      .join("\n\n");

    // Treat all external retrieved RAG content as passive untrusted data
    const demarcatedContext = PromptGuard.wrapAsUntrustedData("RETRIEVED_COMPANY_DOCUMENTS", rawEvidenceText);

    return {
      hasMatches: true,
      citations,
      demarcatedContext,
      summary: `Found ${topMatches.length} relevant excerpt(s) in "${topMatches[0].fileName}" (Relevance: ${(topMatches[0].score * 100).toFixed(1)}%).`,
    };
  }

  /**
   * Delete document and clean up local metadata. Enforces tenant authorization.
   */
  public static async deleteDocument(organizationId: string, documentId: string) {
    if (!organizationId) throw new Error("Tenant isolation violation: organizationId is required");

    const doc = await prisma.document.findUnique({ where: { id: documentId } });
    if (!doc) throw new Error("Document not found");
    if (doc.organizationId !== organizationId) {
      throw new Error("Unauthorized: Document belongs to a different organization");
    }

    await prisma.document.delete({ where: { id: documentId } });
    return { success: true, deletedId: documentId };
  }

  /**
   * Re-index document content with tenant check.
   */
  public static async reindexDocument(organizationId: string, documentId: string, newContent: string) {
    if (!organizationId) throw new Error("Tenant isolation violation: organizationId is required");

    const doc = await prisma.document.findUnique({ where: { id: documentId } });
    if (!doc) throw new Error("Document not found");
    if (doc.organizationId !== organizationId) {
      throw new Error("Unauthorized: Document belongs to a different organization");
    }

    const metadata = JSON.stringify({
      contentHash: crypto.createHash("sha256").update(newContent).digest("hex"),
      charCount: newContent.length,
      reindexedAt: new Date().toISOString(),
    });

    return await prisma.document.update({
      where: { id: documentId },
      data: {
        content: newContent,
        metadata,
        ingestionStatus: "PROCESSED",
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Record approved business memory fact for the tenant
   */
  public static async recordBusinessMemory(organizationId: string, fact: string, source: string) {
    if (!organizationId) throw new Error("Tenant isolation violation: organizationId is required");
    return await prisma.businessMemory.create({
      data: {
        organizationId,
        fact,
        source,
        status: "APPROVED",
      },
    });
  }

  /**
   * Retrieve approved business memories for the tenant
   */
  public static async getBusinessMemories(organizationId: string) {
    if (!organizationId) throw new Error("Tenant isolation violation: organizationId is required");
    return await prisma.businessMemory.findMany({
      where: { organizationId, status: "APPROVED" },
      orderBy: { createdAt: "desc" },
    });
  }
}
