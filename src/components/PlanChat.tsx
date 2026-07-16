"use client";

import { useRef, useState, FormEvent } from "react";
import { Send } from "lucide-react";
import clsx from "clsx";
import { MarkdownMessage } from "@/components/MarkdownMessage";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTIONS = [
  "I want a house down-payment of AED 250,000 by June 2030",
  "What's safe to spend today?",
  "What are my recurring commitments?",
];

export function PlanChat({ initialMessages }: { initialMessages: ChatMessage[] }) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  async function send(text: string) {
    if (!text.trim() || loading) return;
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/plan/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply ?? "..." }]);
    } finally {
      setLoading(false);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    send(input);
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 && (
          <div className="flex flex-col gap-2">
            <p className="mb-1 text-xs text-text-faint">Try asking:</p>
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                className="rounded-xl border border-border-subtle bg-surface-2 px-3 py-2 text-left text-sm text-text-muted hover:text-text"
              >
                {s}
              </button>
            ))}
          </div>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={clsx("flex", m.role === "user" ? "justify-end" : "justify-start")}
          >
            <div
              className={clsx(
                "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                m.role === "user"
                  ? "whitespace-pre-wrap bg-primary text-white"
                  : "bg-surface-2 border border-border-subtle"
              )}
            >
              {m.role === "assistant" ? (
                <MarkdownMessage content={m.content} />
              ) : (
                m.content
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="rounded-2xl border border-border-subtle bg-surface-2 px-4 py-2.5 text-sm text-text-faint">
              Thinking...
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={onSubmit} className="flex gap-2 border-t border-border-subtle p-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Describe a goal, or ask about your plan..."
          className="flex-1 rounded-xl bg-surface-2 px-4 py-2.5 text-sm text-text placeholder:text-text-faint outline-none focus:ring-1 focus:ring-primary"
        />
        <button
          type="submit"
          disabled={loading}
          className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-primary text-white disabled:opacity-40"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
