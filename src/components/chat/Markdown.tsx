import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Check, Copy } from "lucide-react";
import { useState } from "react";

function CodeBlock({ children, className }: { children: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  const lang = className?.replace("language-", "") ?? "";
  return (
    <div className="relative group my-3 rounded-lg overflow-hidden border border-border bg-muted/40">
      <div className="flex items-center justify-between px-3 py-1 text-xs text-muted-foreground bg-muted/60">
        <span>{lang || "code"}</span>
        <button
          onClick={() => {
            navigator.clipboard.writeText(children);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
          className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
        >
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="p-3 overflow-x-auto text-sm">
        <code className={className}>{children}</code>
      </pre>
    </div>
  );
}

export function Markdown({ content }: { content: string }) {
  return (
    <div className="prose prose-sm dark:prose-invert max-w-none break-words [&_p]:my-2 [&_ul]:my-2 [&_ol]:my-2">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code(props: any) {
            const { inline, className, children } = props;
            const value = String(children ?? "").replace(/\n$/, "");
            if (inline) {
              return (
                <code className="px-1 py-0.5 rounded bg-muted text-foreground text-[0.85em]">
                  {value}
                </code>
              );
            }
            return <CodeBlock className={className}>{value}</CodeBlock>;
          },
          a(props) {
            return <a {...props} target="_blank" rel="noreferrer" className="text-primary underline" />;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}