import { Embeddings } from "@langchain/core/embeddings";
import { pipeline } from "@huggingface/transformers";

const MODEL_ID = "Xenova/all-MiniLM-L6-v2";

// transformers.js's pipeline() overloads produce a union TypeScript can't
// represent (TS2590) when narrowed to FeatureExtractionPipeline — typed as
// `any` here rather than fighting the library's type surface.
type Extractor = (texts: string[], options: { pooling: string; normalize: boolean }) => Promise<{ tolist(): number[][] }>;

/**
 * Local, API-key-free embeddings via transformers.js — a small sentence
 * embedding model (~90MB, downloaded once and cached) runs in-process.
 * @langchain/community (the package that used to ship a HuggingFace
 * embeddings wrapper) was deprecated in May 2026 in favor of app-owned
 * integrations, so this wraps the model directly rather than pulling in
 * that package.
 */
export class LocalEmbeddings extends Embeddings {
  private extractorPromise: Promise<Extractor> | null = null;

  constructor() {
    super({});
  }

  private getExtractor(): Promise<Extractor> {
    if (!this.extractorPromise) {
      this.extractorPromise = pipeline("feature-extraction", MODEL_ID) as unknown as Promise<Extractor>;
    }
    return this.extractorPromise;
  }

  async embedDocuments(documents: string[]): Promise<number[][]> {
    const extractor = await this.getExtractor();
    const output = await extractor(documents, { pooling: "mean", normalize: true });
    return output.tolist();
  }

  async embedQuery(document: string): Promise<number[]> {
    const [vector] = await this.embedDocuments([document]);
    return vector;
  }
}
