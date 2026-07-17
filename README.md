# Runway

A publicly deployed applied-AI personal-finance prototype inspired by a personally relevant scenario involving a Mexican professional living in the United States.

Runway explores how a hypothetical U.S. digital bank could help a customer understand what is genuinely safe to spend after recurring expenses, savings goals, and planned obligations are considered.

🔗 **[Live demo](https://pfm.regina-espinosa.com/login)**

> **Demo note:** Runway uses a fictional persona and synthetic financial data. Do not enter real personal, banking, or financial information.

## Core capabilities

- **Safe-to-spend calculation:** Computes a conservative daily amount from confirmed commitments, savings goals, and an uncertainty buffer instead of displaying only the account balance.
- **Recurring-commitment detection:** Identifies patterns in transaction history using merchant, amount, and day-of-month clustering.
- **Salary-day allocation:** Lets the user preview and trigger a deterministic allocation of available funds across commitments and savings goals.
- **LangGraph multi-agent chat:** Routes questions to three specialist agents: Goal Planner, Cash-Flow Interpreter, and Policy Q&A.
- **Deterministic tool grounding:** Keeps core financial calculations outside the LLM to reduce numeric hallucination risk.
- **Custom narrow RAG:** Uses local embeddings, an in-memory vector store, and cosine-similarity retrieval over a small product-policy knowledge base.
- **Golden-set evaluation:** Tests six conversational scenarios for routing correctness and expected values computed by the application's deterministic services.

## Architecture

```text
React / Next.js interface
        │
        ▼
Next.js API routes
        │
        ├──────────────────────────┐
        ▼                          ▼
Deterministic domain logic   LangGraph Orchestrator
        ▲                          │
        │ tool calls    ┌──────────┼──────────┐
        │               ▼          ▼          ▼
        └───────── Goal Planner  Cash-Flow  Policy Q&A
                               Interpreter       │
                                                 ▼
                                          Custom RAG
                                      (in-memory, no DB)
        │
        ▼
Supabase / PostgreSQL
```

Goal Planner and Cash-Flow Interpreter reach Supabase indirectly, through tool calls back into the deterministic domain logic. Policy Q&A never touches the database — its retrieval runs entirely in memory, against a fixed set of hardcoded policy passages embedded once at server start.

The codebase separates:

- `src/domain/` — framework-independent financial calculations and rules
- `src/lib/langchain/` — orchestration, agents, tools, model integration, and RAG
- `src/lib/repository/` and `supabase/` — persistence and the nine-table schema
- `src/app/api/` — ten Next.js API routes
- `evals/` — the six-scenario AI evaluation harness

## Stack

**Next.js 16 · React · TypeScript · Supabase/PostgreSQL · LangChain · LangGraph · Anthropic · Hugging Face Transformers · Vercel**

## Evaluation and debugging

The evaluation harness runs the real agent stack against fixed scenarios and ground truth produced by the same deterministic services used by the application.

It helped surface and correct:

- a tool-output serialization defect;
- an agent-routing misclassification.

Run it with:

```bash
npm run eval
```

This command calls the configured Anthropic API and may incur usage.

## Deployment

Runway is deployed publicly on Vercel under a custom domain and connected to GitHub for managed build and deployment updates.

Changes reaching the configured production branch update the live application.

This demonstrates public deployment and managed continuous deployment, not ownership of a custom CI/CD platform or production cloud infrastructure.

## Running locally

```bash
npm install
cp .env.example .env.local
```

Fill in your Supabase and Anthropic credentials in `.env.local`, then apply `supabase/migrations/0001_init.sql` in your Supabase project's SQL editor — the seed script inserts rows into tables that migration creates, it doesn't create them itself.

```bash
npm run seed
npm run dev
```

Then open:

```text
http://localhost:3000/login
```

Useful commands:

```bash
npm run build
npm run lint
npm run eval
npx tsc --noEmit
```

<details>
<summary><strong>Prototype scope and technical boundaries</strong></summary>

Runway is a portfolio prototype, not a production banking system.

Current boundaries include:

- one fictional demo user and synthetic data;
- no real bank, payment-network, card, or remittance integration;
- demo-level authentication and permissive database policies;
- limited runtime validation at API boundaries;
- non-atomic waterfall writes and an incomplete undo path;
- no conventional unit or integration test suite;
- limited production observability;
- a static eight-passage RAG knowledge base with no ingestion pipeline, persistent index, refresh process, or enforced citations;
- no custom GitHub Actions workflow, container pipeline, or infrastructure as code.

The application demonstrates applied AI-system design, LangGraph orchestration, deterministic tool grounding, narrow RAG, evaluation-driven debugging, full-stack TypeScript engineering, persistence, and managed deployment. It should not be interpreted as a secure, multi-tenant, production-ready financial platform.

</details>
