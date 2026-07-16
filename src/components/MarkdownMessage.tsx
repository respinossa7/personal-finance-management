import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

const COMPONENTS: Components = {
  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
  strong: ({ children }) => <strong className="font-semibold text-primary">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  ul: ({ children }) => <ul className="mb-2 flex flex-col gap-1 last:mb-0">{children}</ul>,
  ol: ({ children }) => (
    <ol className="mb-2 flex flex-col gap-1 last:mb-0 [counter-reset:item]">{children}</ol>
  ),
  li: ({ children }) => (
    <li className="flex gap-2 pl-0.5">
      <span className="mt-1.5 h-1.5 w-1.5 flex-none rounded-full bg-primary-dim" />
      <span>{children}</span>
    </li>
  ),
  h1: ({ children }) => (
    <h3 className="mb-1 mt-1 text-[0.95rem] font-semibold text-primary-dim first:mt-0">
      {children}
    </h3>
  ),
  h2: ({ children }) => (
    <h3 className="mb-1 mt-1 text-[0.95rem] font-semibold text-primary-dim first:mt-0">
      {children}
    </h3>
  ),
  h3: ({ children }) => (
    <h3 className="mb-1 mt-1 text-[0.95rem] font-semibold text-primary-dim first:mt-0">
      {children}
    </h3>
  ),
  a: ({ children, href }) => (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="font-medium text-primary underline underline-offset-2"
    >
      {children}
    </a>
  ),
  code: ({ children }) => (
    <code className="rounded bg-primary/10 px-1 py-0.5 text-[0.85em] text-primary-dim">
      {children}
    </code>
  ),
};

export function MarkdownMessage({ content }: { content: string }) {
  return (
    <div className="text-primary-dim">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={COMPONENTS}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
