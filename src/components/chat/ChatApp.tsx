import { useEffect, useMemo, useRef, useState } from "react";
import {
  Menu,
  Settings as SettingsIcon,
  Info,
  Sparkles,
  Save,
  Pencil,
  Check,
  X,
  Download,
  Github,
} from "lucide-react";
import { useChat } from "@/hooks/useChat";
import { getChromeAIRuntimeHint } from "@/services/chromeLocalAI";
import { Sidebar } from "./Sidebar";
import { MessageItem } from "./MessageItem";
import { Composer } from "./Composer";
import { SettingsDialog } from "./SettingsDialog";
import { InstructionsDialog } from "./InstructionsDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { db } from "@/services/db";
import { hasFSAccess, saveCurrentChat, downloadBlob, chatToMarkdown } from "@/services/folder";
import { exportAllChatsAsTxt } from "@/services/folder";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function ChatApp() {
  const chat = useChat();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [instrOpen, setInstrOpen] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const activeConv = useMemo(
    () => chat.conversations.find((c) => c.id === chat.activeId) ?? null,
    [chat.conversations, chat.activeId],
  );

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [chat.messages]);

  const apiAvailable =
    typeof (globalThis as any).LanguageModel !== "undefined" ||
    typeof (globalThis as any).ai?.languageModel !== "undefined";
  const runtimeHint = getChromeAIRuntimeHint();

  const startEditTitle = () => {
    if (!activeConv) return;
    setTitleDraft(activeConv.title);
    setEditingTitle(true);
  };
  const commitTitle = () => {
    if (activeConv && titleDraft.trim()) {
      chat.renameConversation(activeConv.id, titleDraft.trim());
    }
    setEditingTitle(false);
  };

  const onSaveCurrentChat = async () => {
    if (!activeConv) return;
    try {
      if (hasFSAccess() && (await db.getFolderHandle())) {
        await saveCurrentChat(activeConv, chat.messages, chat.summary);
        toast.success("Chat saved to selected folder.");
      } else {
        downloadBlob(
          `${activeConv.title || "chat"}.json`,
          JSON.stringify(
            { conversation: activeConv, messages: chat.messages, summary: chat.summary },
            null,
            2,
          ),
          "application/json",
        );
        downloadBlob(
          `${activeConv.title || "chat"}.md`,
          chatToMarkdown(activeConv, chat.messages),
          "text/markdown",
        );
        toast.success("Chat downloaded (no folder configured).");
      }
    } catch (e: any) {
      toast.error(`Save error: ${e?.message ?? e}`);
    }
  };

  const onExportAllTxt = async () => {
    try {
      const count = await exportAllChatsAsTxt();
      toast.success(`Exported ${count} chat${count === 1 ? "" : "s"} as .txt`);
    } catch (e: any) {
      toast.error(`Export error: ${e?.message ?? e}`);
    }
  };

  return (
    <div className="h-screen w-full flex bg-background text-foreground overflow-hidden">
      {/* Sidebar - desktop */}
      <div className="hidden md:flex h-full">
        <Sidebar
          conversations={chat.conversations}
          activeId={chat.activeId}
          onSelect={chat.setActiveId}
          onNew={() => chat.newChat()}
          onRename={chat.renameConversation}
          onDelete={chat.deleteConversation}
        />
      </div>
      {/* Sidebar - mobile drawer */}
      <div
        className={cn(
          "fixed inset-0 z-40 md:hidden transition-opacity",
          sidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
        )}
        onClick={() => setSidebarOpen(false)}
      >
        <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" />
        <div
          className={cn(
            "absolute left-0 top-0 h-full transition-transform",
            sidebarOpen ? "translate-x-0" : "-translate-x-full",
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <Sidebar
            conversations={chat.conversations}
            activeId={chat.activeId}
            onSelect={(id) => {
              chat.setActiveId(id);
              setSidebarOpen(false);
            }}
            onNew={() => {
              chat.newChat();
              setSidebarOpen(false);
            }}
            onRename={chat.renameConversation}
            onDelete={chat.deleteConversation}
            onClose={() => setSidebarOpen(false)}
          />
        </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center justify-between border-b border-border px-3 py-2">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              {editingTitle && activeConv ? (
                <div className="flex items-center gap-1">
                  <Input
                    autoFocus
                    value={titleDraft}
                    onChange={(e) => setTitleDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") commitTitle();
                      if (e.key === "Escape") setEditingTitle(false);
                    }}
                    className="h-7 text-sm w-[40vw] max-w-xs"
                  />
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={commitTitle}>
                    <Check className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setEditingTitle(false)}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ) : (
                <button
                  onClick={startEditTitle}
                  disabled={!activeConv}
                  className="group flex items-center gap-1 text-sm font-medium truncate max-w-[40vw] hover:text-primary transition-colors disabled:cursor-default disabled:hover:text-foreground"
                  title={activeConv ? "Rename conversation" : undefined}
                >
                  <span className="truncate">{activeConv?.title || "Chrome GPT Local Chat"}</span>
                  {activeConv && (
                    <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-60 shrink-0" />
                  )}
                </button>
              )}
              {activeConv !== undefined && (
                <a
                  href="https://github.com/mrudinal/local-ai-chat"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-2 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                  title="View repository on GitHub"
                >
                  <Github className="h-4 w-4" />
                  <span className="hidden sm:inline">GitHub</span>
                </a>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={onExportAllTxt}>
              <Download className="h-4 w-4 mr-1" /> Export
            </Button>
            <Button variant="ghost" size="sm" onClick={onSaveCurrentChat} disabled={!activeConv}>
              <Save className="h-4 w-4 mr-1" /> Save
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setInstrOpen(true)}>
              <Info className="h-4 w-4 mr-1" /> Instructions
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setSettingsOpen(true)}>
              <SettingsIcon className="h-4 w-4 mr-1" /> Settings
            </Button>
          </div>
        </header>

        {!apiAvailable && (
          <div className="border-b border-destructive/40 bg-destructive/10 text-destructive px-4 py-2 text-xs">
            Chrome Built-in AI (LanguageModel) was not detected.{" "}
            {runtimeHint.secureContext
              ? 'Open Settings → "Check Chrome GPT" for diagnostics.'
              : "This origin is not secure. Use HTTPS or localhost."}
            {runtimeHint.suggestedLocalhostUrl && (
              <a
                href={runtimeHint.suggestedLocalhostUrl}
                className="ml-2 underline underline-offset-2 hover:opacity-80"
              >
                Open localhost
              </a>
            )}
          </div>
        )}
        {chat.error && (
          <div className="border-b border-destructive/40 bg-destructive/10 text-destructive px-4 py-2 text-xs">
            {chat.error}
          </div>
        )}

        <div ref={scrollRef} className="flex-1 overflow-y-auto">
          {chat.messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center px-6 text-center">
              <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                <Sparkles className="h-6 w-6" />
              </div>
              <h1 className="text-2xl font-semibold tracking-tight">Chrome GPT Local Chat</h1>
              <p className="mt-2 text-sm text-muted-foreground max-w-md">
                Runs with the LLM installed in your Chrome.
              </p>
              <div className="mt-6 grid sm:grid-cols-2 gap-2 max-w-xl w-full">
                {[
                  "Explain quantum entanglement simply",
                  "Write a haiku about the ocean",
                  "Give me 5 productivity tips",
                  "Translate 'Hello, world' to Spanish",
                ].map((s) => (
                  <button
                    key={s}
                    onClick={() => chat.sendUserMessage(s)}
                    className="text-left text-sm rounded-lg border border-border bg-card hover:bg-accent px-3 py-2 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div>
              {chat.messages.map((m, i) => (
                <MessageItem
                  key={m.id}
                  message={m}
                  isLast={i === chat.messages.length - 1}
                  isStreaming={
                    chat.isStreaming && i === chat.messages.length - 1 && m.role === "assistant"
                  }
                  onEdit={chat.editUserMessage}
                  onRegenerate={chat.regenerateLast}
                />
              ))}
            </div>
          )}
        </div>

        <Composer onSend={chat.sendUserMessage} onStop={chat.stop} isStreaming={chat.isStreaming} />
      </div>

      <SettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        settings={chat.settings}
        onSave={chat.updateSettings}
        onClearAll={async () => {
          await db.clearAll();
          location.reload();
        }}
      />
      <InstructionsDialog open={instrOpen} onOpenChange={setInstrOpen} />
    </div>
  );
}
