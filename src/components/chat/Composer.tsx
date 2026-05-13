import { useEffect, useRef, useState } from "react";
import { Send, Square } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  onSend: (text: string) => void;
  onStop: () => void;
  isStreaming: boolean;
}

export function Composer({ onSend, onStop, isStreaming }: Props) {
  const [value, setValue] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 200) + "px";
  }, [value]);

  const submit = () => {
    const t = value.trim();
    if (!t || isStreaming) return;
    onSend(t);
    setValue("");
  };

  return (
    <div className="border-t border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-4">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-end gap-2 rounded-2xl border border-border bg-card p-2 shadow-sm">
          <textarea
            ref={ref}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            placeholder="Message Gemma Local…  (Shift+Enter for new line)"
            rows={1}
            className="flex-1 resize-none bg-transparent px-2 py-2 outline-none text-sm max-h-[200px]"
          />
          {isStreaming ? (
            <Button size="icon" variant="destructive" onClick={onStop} title="Stop">
              <Square className="h-4 w-4" />
            </Button>
          ) : (
            <Button size="icon" onClick={submit} disabled={!value.trim()} title="Send">
              <Send className="h-4 w-4" />
            </Button>
          )}
        </div>
        <p className="mt-2 text-center text-[11px] text-muted-foreground">
          Runs locally in Chrome via Built-in AI · No backend · No API key
        </p>
      </div>
    </div>
  );
}