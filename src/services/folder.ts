import { db } from "./db";
import type { Conversation, Message, ConversationSummary } from "@/types/chat";

interface SavedChatDirMeta {
  dirName: string;
  firstSavedAt: number;
}

function sanitizeSegment(value: string) {
  const cleaned = value
    .trim()
    .toLowerCase()
    .split("")
    .filter((ch) => {
      const code = ch.charCodeAt(0);
      if (code < 32 || code === 127) return false;
      return !/[<>:"/\\|?*]/.test(ch);
    })
    .join("")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[.-]+|[.-]+$/g, "");
  return (cleaned || "chat").slice(0, 60);
}

function formatFolderStamp(ms: number) {
  return new Date(ms).toISOString().replace(/[:.]/g, "-");
}

async function getOrCreateChatDirMeta(conv: Conversation): Promise<SavedChatDirMeta> {
  const key = `chatDirMeta:${conv.id}`;
  const existing = await db.getKV<SavedChatDirMeta>(key);
  if (existing?.dirName && typeof existing.firstSavedAt === "number") return existing;

  const firstSavedAt = Date.now();
  const titlePart = sanitizeSegment(conv.title || "chat");
  const dirName = `${titlePart}__${formatFolderStamp(firstSavedAt)}`;
  const created: SavedChatDirMeta = { dirName, firstSavedAt };
  await db.putKV(key, created);
  return created;
}

function hasFSAccess() {
  return typeof (window as any).showDirectoryPicker === "function";
}

export async function chooseFolder(): Promise<FileSystemDirectoryHandle> {
  if (!hasFSAccess()) throw new Error("File System Access API not supported in this browser.");
  const handle = await (window as any).showDirectoryPicker({ mode: "readwrite" });
  await db.putFolderHandle(handle);
  return handle;
}

export async function verifyFolderPermission(): Promise<
  "granted" | "prompt" | "denied" | "no-handle"
> {
  const h = await db.getFolderHandle();
  if (!h) return "no-handle";
  const anyH = h as any;
  let perm: PermissionState = await anyH.queryPermission({ mode: "readwrite" });
  if (perm === "prompt") {
    perm = await anyH.requestPermission({ mode: "readwrite" });
  }
  return perm as any;
}

async function getOrCreateRoot(handle: FileSystemDirectoryHandle) {
  return handle.getDirectoryHandle("ChromeLocalAIChat", { create: true });
}

async function writeFile(dir: FileSystemDirectoryHandle, name: string, contents: string) {
  const fh = await dir.getFileHandle(name, { create: true });
  const w = await (fh as any).createWritable();
  await w.write(contents);
  await w.close();
}

export function chatToMarkdown(conv: Conversation, messages: Message[]) {
  const lines: string[] = [
    `# ${conv.title}`,
    "",
    `_Created: ${new Date(conv.createdAt).toISOString()}_`,
    "",
  ];
  for (const m of messages) {
    if (m.role === "system") continue;
    lines.push(`## ${m.role === "user" ? "User" : "Assistant"}`, "", m.content, "");
  }
  return lines.join("\n");
}

export async function saveCurrentChat(
  conv: Conversation,
  messages: Message[],
  summary?: ConversationSummary,
) {
  const handle = await db.getFolderHandle();
  if (!handle) throw new Error("No folder selected.");
  const perm = await verifyFolderPermission();
  if (perm !== "granted") throw new Error("Folder permission not granted.");
  const root = await getOrCreateRoot(handle);
  const chatsDir = await root.getDirectoryHandle("chats", { create: true });
  const dirMeta = await getOrCreateChatDirMeta(conv);
  const convDir = await chatsDir.getDirectoryHandle(dirMeta.dirName, { create: true });

  await writeFile(
    convDir,
    "chat.json",
    JSON.stringify(
      { conversation: conv, messages, summary, saveMeta: { firstSavedAt: dirMeta.firstSavedAt } },
      null,
      2,
    ),
  );
  await writeFile(convDir, "messages.json", JSON.stringify(messages, null, 2));
  await writeFile(convDir, "chat.md", chatToMarkdown(conv, messages));
  if (summary) await writeFile(convDir, "summary.json", JSON.stringify(summary, null, 2));

  // projects.json index
  const all = await db.listConversations();
  await writeFile(root, "projects.json", JSON.stringify(all, null, 2));
}

export async function exportAllChats() {
  const handle = await db.getFolderHandle();
  if (handle) {
    const convs = await db.listConversations();
    for (const c of convs) {
      const msgs = await db.getMessages(c.id);
      const sum = await db.getSummary(c.id);
      await saveCurrentChat(c, msgs, sum);
    }
    return { mode: "folder" as const, count: convs.length };
  }
  // Fallback: download single JSON
  const convs = await db.listConversations();
  const data: any = { conversations: [] };
  for (const c of convs) {
    const msgs = await db.getMessages(c.id);
    const sum = await db.getSummary(c.id);
    data.conversations.push({ conversation: c, messages: msgs, summary: sum });
  }
  downloadBlob("chrome-local-ai-chats.json", JSON.stringify(data, null, 2), "application/json");
  return { mode: "download" as const, count: convs.length };
}

export function downloadBlob(name: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export { hasFSAccess };

function chatToTxt(conv: Conversation, messages: Message[]) {
  const lines: string[] = [
    `=== ${conv.title} ===`,
    `Created: ${new Date(conv.createdAt).toISOString()}`,
    "",
  ];
  for (const m of messages) {
    if (m.role === "system") continue;
    const who = m.role === "user" ? "User" : "Assistant";
    lines.push(`[${who}]`, m.content, "");
  }
  return lines.join("\n");
}

export async function exportAllChatsAsTxt(): Promise<number> {
  const convs = await db.listConversations();
  const parts: string[] = [];
  for (const c of convs) {
    const msgs = await db.getMessages(c.id);
    parts.push(chatToTxt(c, msgs));
    parts.push("\n----------------------------------------\n");
  }
  const content = parts.join("\n") || "No conversations.";
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  downloadBlob(`chrome-local-ai-chats-${stamp}.txt`, content, "text/plain");
  return convs.length;
}
