import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AppSettings, Conversation, Message, ConversationSummary } from "@/types/chat";
import { checkChromeAIStatus, type AIStatus } from "@/services/chromeLocalAI";
import {
  chooseFolder,
  hasFSAccess,
  verifyFolderPermission,
} from "@/services/folder";
import { db } from "@/services/db";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  settings: AppSettings;
  onSave: (s: AppSettings) => void;
  onClearAll: () => void;
}

export function SettingsDialog({
  open,
  onOpenChange,
  settings,
  onSave,
  onClearAll,
}: Props) {
  const [s, setS] = useState<AppSettings>(settings);
  const [diag, setDiag] = useState<string>("");
  const [aiStatus, setAiStatus] = useState<AIStatus | null>(null);
  const [folderName, setFolderName] = useState<string | null>(null);
  const [folderPerm, setFolderPerm] = useState<string | null>(null);

  const refreshFolder = async () => {
    const h = await db.getFolderHandle();
    setFolderName(h?.name ?? null);
    if (h) {
      try {
        const p = await (h as any).queryPermission({ mode: "readwrite" });
        setFolderPerm(p);
      } catch {
        setFolderPerm(null);
      }
    } else {
      setFolderPerm(null);
    }
  };

  useEffect(() => {
    if (open) refreshFolder();
  }, [open]);

  const update = <K extends keyof AppSettings>(k: K, v: AppSettings[K]) =>
    setS((prev) => ({ ...prev, [k]: v }));

  const log = (msg: string) => setDiag((d) => (d ? d + "\n" : "") + msg);

  const runCheck = async () => {
    setDiag("");
    log("Checking Chrome Local AI…");
    const r = await checkChromeAIStatus();
    setAiStatus(r);
    log(`API detected: ${r.apiDetected ? "yes" : "no"}`);
    log(`Availability: ${r.availability}`);
    if (r.availability === "downloadable" || r.availability === "downloading") {
      log("Chrome may need to download or prepare Gemini Nano. Open chrome://on-device-internals to track progress.");
    }
    log(`Session creation test: ${r.sessionTest}`);
    if (r.testPromptResult) log(`Test prompt result: ${r.testPromptResult}`);
    if (r.error) log(`Error: ${r.error}`);
  };

  const onChooseFolder = async () => {
    try {
      await chooseFolder();
      log("Folder selected and permission stored.");
      await refreshFolder();
    } catch (e: any) {
      log(`Folder error: ${e?.message ?? e}`);
    }
  };

  const onVerify = async () => {
    try {
      const p = await verifyFolderPermission();
      log(`Folder permission: ${p}`);
      await refreshFolder();
    } catch (e: any) {
      log(`Verify error: ${e?.message ?? e}`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Theme</Label>
              <Select value={s.theme} onValueChange={(v) => update("theme", v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="system">System</SelectItem>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Default language</Label>
              <Select value={s.language} onValueChange={(v) => update("language", v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto</SelectItem>
                  <SelectItem value="es">Spanish</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>System instructions / persona</Label>
            <Textarea
              rows={4}
              value={s.systemPrompt}
              onChange={(e) => update("systemPrompt", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Context strategy</Label>
              <Select value={s.contextStrategy} onValueChange={(v) => update("contextStrategy", v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Simple recent messages</SelectItem>
                  <SelectItem value="recent+summary">Recent + summary</SelectItem>
                  <SelectItem value="full">Full until token limit</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Max recent messages</Label>
              <Input
                type="number"
                value={s.maxRecentMessages}
                onChange={(e) => update("maxRecentMessages", Math.max(1, Number(e.target.value) || 1))}
              />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-md border border-border p-3">
            <div>
              <Label>Auto-summary</Label>
              <p className="text-xs text-muted-foreground">Summarize older messages automatically.</p>
            </div>
            <Switch checked={s.autoSummary} onCheckedChange={(v) => update("autoSummary", v)} />
          </div>

          <div>
            <Label>Summary interval (messages)</Label>
            <Input
              type="number"
              value={s.summaryInterval}
              onChange={(e) => update("summaryInterval", Math.max(2, Number(e.target.value) || 20))}
            />
          </div>

          <div className="rounded-md border border-border p-3 space-y-2">
            <h4 className="text-sm font-medium">Save folder</h4>
            {!hasFSAccess() && (
              <p className="text-xs text-muted-foreground">
                File System Access API not available. Use Export to download files instead.
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="secondary" onClick={onChooseFolder} disabled={!hasFSAccess()}>
                Choose Projects Folder
              </Button>
              <Button size="sm" variant="secondary" onClick={onVerify} disabled={!hasFSAccess()}>
                Verify Folder Permission
              </Button>
            </div>
            {folderName ? (
              <div className="text-xs rounded border border-border bg-muted/40 px-2 py-1.5 flex items-center justify-between gap-2">
                <span className="truncate">
                  <span className="text-muted-foreground">Selected folder:</span>{" "}
                  <span className="font-medium">{folderName}</span>
                </span>
                {folderPerm && (
                  <span className={folderPerm === "granted" ? "text-primary" : "text-muted-foreground"}>
                    {folderPerm}
                  </span>
                )}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No folder selected yet.</p>
            )}
          </div>

          <div className="rounded-md border border-border p-3 space-y-2">
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={runCheck}>Check Chrome Local AI</Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => {
                  if (confirm("Clear all local data (chats, settings, folder handle)?")) {
                    onClearAll();
                    log("Local data cleared.");
                  }
                }}
              >
                Clear local data
              </Button>
            </div>
            {aiStatus && (
              <div className="text-xs grid grid-cols-2 gap-x-4 gap-y-1 mt-2">
                <span>API detected:</span><span>{aiStatus.apiDetected ? "yes" : "no"}</span>
                <span>Availability:</span><span>{aiStatus.availability}</span>
                <span>Session test:</span><span>{aiStatus.sessionTest}</span>
                {aiStatus.testPromptResult && (<><span>Test prompt:</span><span className="truncate">{aiStatus.testPromptResult}</span></>)}
              </div>
            )}
            <pre className="text-[11px] bg-muted/50 rounded p-2 max-h-40 overflow-auto whitespace-pre-wrap">
{diag || "Diagnostics output will appear here. Tip: open chrome://on-device-internals to inspect the local model state. Chrome must be updated and the page must be served over HTTPS or localhost."}
            </pre>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => { onSave(s); onOpenChange(false); }}>Save settings</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}