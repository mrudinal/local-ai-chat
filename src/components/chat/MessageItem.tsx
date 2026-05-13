import { useState } from "react";
import { Check, Copy, Pencil, RefreshCw, User, Bot } from "lucide-react";
import type { Message } from "@/types/chat";
import { Markdown } from "./Markdown";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface Props {
  message: Message;
  isLast: boolean;
  isStreaming: boolean;
  onEdit?: (id: string, content: string) => void;
  onRegenerate?: () => void;
}

export function MessageItem({ message, isLast, isStreaming, onEdit, onRegenerate }: Props) {
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(message.content);
  const isUser = message.role === "user";

  return (
    <div className={cn("group w-full py-6", !isUser && "bg-muted/30")}>
      <div className="mx-auto max-w-3xl px-4 flex gap-4">
        <div
          className={cn(
            "h-8 w-8 shrink-0 rounded-md flex items-center justify-center text-xs font-medium",
            isUser ? "bg-primary text-primary-foreground" : "bg-foreground/10 text-foreground",
          )}
        >
          {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
        </div>
        <div className="min-w-0 flex-1">
          {editing ? (
            <div className="space-y-2">
              <Textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                rows={Math.min(10, draft.split("\n").length + 1)}
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => {
                    setEditing(false);
                    onEdit?.(message.id, draft);
                  }}
                >
                  Save & resend
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setEditing(false);
                    setDraft(message.content);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <>
              {message.content ? (
                <Markdown content={message.content} />
              ) : (
                isStreaming && (
                  <span className="inline-block h-4 w-2 animate-pulse bg-foreground/60" />
                )
              )}
              {message.status === "error" && (
                <p className="mt-2 text-xs text-destructive">Generation failed.</p>
              )}
              {message.status === "partial" && (
                <p className="mt-2 text-xs text-muted-foreground">Stopped</p>
              )}
              <div className="mt-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  className="p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground"
                  title="Copy"
                  onClick={() => {
                    navigator.clipboard.writeText(message.content);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1200);
                  }}
                >
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
                {isUser && onEdit && (
                  <button
                    className="p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground"
                    title="Edit & resend"
                    onClick={() => setEditing(true)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                )}
                {!isUser && isLast && onRegenerate && !isStreaming && (
                  <button
                    className="p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground"
                    title="Regenerate"
                    onClick={onRegenerate}
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
