import { Document } from "@langchain/core/documents";
import { LocalEmbeddings } from "./embeddings";
import { InMemoryVectorStore } from "./vectorStore";
import { POLICY_DOCS } from "./policyDocs";

let storePromise: Promise<InMemoryVectorStore> | null = null;

/**
 * Builds the policy-doc vector store once per server process and reuses it
 * — embedding the (small, fixed) knowledge base on every request would be
 * wasted work, and the corpus never changes at runtime.
 */
function getPolicyVectorStore(): Promise<InMemoryVectorStore> {
  if (!storePromise) {
    storePromise = (async () => {
      const store = new InMemoryVectorStore(new LocalEmbeddings());
      const documents = POLICY_DOCS.map(
        (doc) => new Document({ pageContent: doc.content, metadata: { id: doc.id, title: doc.title } })
      );
      await store.addDocuments(documents);
      return store;
    })();
  }
  return storePromise;
}

export interface PolicySearchResult {
  title: string;
  content: string;
}

export async function searchPolicyDocs(query: string, k = 3): Promise<PolicySearchResult[]> {
  const store = await getPolicyVectorStore();
  const results = await store.similaritySearch(query, k);
  return results.map((doc) => ({
    title: (doc.metadata.title as string) ?? "Untitled policy",
    content: doc.pageContent,
  }));
}
