import { VectorStore } from "@langchain/core/vectorstores";
import { Document, type DocumentInterface } from "@langchain/core/documents";
import type { EmbeddingsInterface } from "@langchain/core/embeddings";

interface StoredEntry {
  document: DocumentInterface;
  vector: number[];
}

/**
 * A minimal in-memory VectorStore, hand-rolled rather than pulled from
 * @langchain/community (deprecated May 2026 — see embeddings.ts). Fine for
 * a knowledge base this small (a few dozen policy snippets); a real
 * production corpus would use a proper ANN index instead of brute-force
 * cosine similarity.
 */
export class InMemoryVectorStore extends VectorStore {
  private entries: StoredEntry[] = [];

  declare FilterType: (doc: DocumentInterface) => boolean;

  constructor(embeddings: EmbeddingsInterface) {
    super(embeddings, {});
  }

  _vectorstoreType(): string {
    return "in_memory_cosine";
  }

  async addVectors(vectors: number[][], documents: DocumentInterface[]): Promise<void> {
    vectors.forEach((vector, i) => this.entries.push({ document: documents[i], vector }));
  }

  async addDocuments(documents: DocumentInterface[]): Promise<void> {
    const vectors = await this.embeddings.embedDocuments(documents.map((d) => d.pageContent));
    await this.addVectors(vectors, documents);
  }

  async similaritySearchVectorWithScore(
    query: number[],
    k: number,
    filter?: this["FilterType"]
  ): Promise<[DocumentInterface, number][]> {
    const candidates = filter ? this.entries.filter((e) => filter(e.document)) : this.entries;
    return candidates
      .map((entry): [DocumentInterface, number] => [entry.document, cosineSimilarity(query, entry.vector)])
      .sort((a, b) => b[1] - a[1])
      .slice(0, k);
  }
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export { Document };
