import { useMemo, useState } from "react";
import { Plus, Search, Trash2, Pencil, MessageSquare, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Conversation } from "@/types/chat";
import { cn } from "@/lib/utils";

interface Props {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onRename: (id: string, title: string) => void;
  onDelete: (id: string) => void;
  onClose?: () => void;
}

export function Sidebar({ conversations, activeId, onSelect, onNew, onRename, onDelete, onClose }: Props) {
  const [q, setQ] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const filtered = useMemo(() => {
    if (!q.trim()) return conversations;
    const t = q.toLowerCase();
    return conversations.filter((c) => c.title.toLowerCase().includes(t));
  }, [conversations, q]);

  return (
    <aside className="flex h-full w-72 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      <div className="flex items-center gap-2 p-3">
        <Button onClick={onNew} className="flex-1 justify-start gap-2" variant="default">
          <Plus className="h-4 w-4" /> New chat
        </Button>
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose} className="md:hidden">
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      <div className="px-3 pb-2">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search conversations"
            className="pl-7 h-8 text-sm bg-sidebar-accent border-sidebar-border"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-2 pb-3">
        {filtered.length === 0 && (
          <p className="px-2 py-4 text-xs text-muted-foreground">No conversations yet.</p>
        )}
        <ul className="space-y-1">
          {filtered.map((c) => {
            const active = c.id === activeId;
            const isEditing = editingId === c.id;
            return (
              <li
                key={c.id}
                className={cn(
                  "group flex items-center gap-1 rounded-md px-2 py-1.5 text-sm cursor-pointer",
                  active ? "bg-sidebar-accent text-sidebar-accent-foreground" : "hover:bg-sidebar-accent/60",
                )}
                onClick={() => !isEditing && onSelect(c.id)}
              >
                <MessageSquare className="h-3.5 w-3.5 shrink-0 opacity-70" />
                {isEditing ? (
                  <input
                    autoFocus
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={() => {
                      onRename(c.id, editValue.trim());
                      setEditingId(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        onRename(c.id, editValue.trim());
                        setEditingId(null);
                      }
                      if (e.key === "Escape") setEditingId(null);
                    }}
                    className="flex-1 bg-transparent outline-none text-sm"
                  />
                ) : (
                  <span className="flex-1 truncate">{c.title || "Untitled"}</span>
                )}
                <button
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:text-foreground"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingId(c.id);
                    setEditValue(c.title);
                  }}
                  title="Rename"
                >
                  <Pencil className="h-3 w-3" />
                </button>
                <button
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm("Delete this conversation?")) onDelete(c.id);
                  }}
                  title="Delete"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </li>
            );
          })}
        </ul>
      </div>
      <div className="border-t border-sidebar-border p-3 text-[11px] text-muted-foreground">
        Local-only. Powered by Chrome Built-in AI (Gemini Nano).
      </div>
    </aside>
  );
}