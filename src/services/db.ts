import { openDB, type IDBPDatabase } from "idb";
import type { Conversation, Message, ConversationSummary, AppSettings } from "@/types/chat";
import { DEFAULT_SETTINGS } from "@/types/chat";

const DB_NAME = "chrome-local-ai-chat";
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("conversations")) {
          db.createObjectStore("conversations", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("messages")) {
          const s = db.createObjectStore("messages", { keyPath: "id" });
          s.createIndex("by_conv", "conversationId");
        }
        if (!db.objectStoreNames.contains("summaries")) {
          db.createObjectStore("summaries", { keyPath: "conversationId" });
        }
        if (!db.objectStoreNames.contains("kv")) {
          db.createObjectStore("kv");
        }
      },
    });
  }
  return dbPromise;
}

export const db = {
  async listConversations(): Promise<Conversation[]> {
    const d = await getDB();
    const all = (await d.getAll("conversations")) as Conversation[];
    return all.sort((a, b) => b.updatedAt - a.updatedAt);
  },
  async getConversation(id: string): Promise<Conversation | undefined> {
    const d = await getDB();
    return (await d.get("conversations", id)) as Conversation | undefined;
  },
  async putConversation(c: Conversation) {
    const d = await getDB();
    await d.put("conversations", c);
  },
  async deleteConversation(id: string) {
    const d = await getDB();
    await d.delete("conversations", id);
    const tx = d.transaction("messages", "readwrite");
    const idx = tx.store.index("by_conv");
    for await (const cur of idx.iterate(id)) cur.delete();
    await tx.done;
    await d.delete("summaries", id);
  },
  async getMessages(conversationId: string): Promise<Message[]> {
    const d = await getDB();
    const all = (await d.getAllFromIndex("messages", "by_conv", conversationId)) as Message[];
    return all.sort((a, b) => a.createdAt - b.createdAt);
  },
  async putMessage(m: Message) {
    const d = await getDB();
    await d.put("messages", m);
  },
  async deleteMessage(id: string) {
    const d = await getDB();
    await d.delete("messages", id);
  },
  async getSummary(conversationId: string): Promise<ConversationSummary | undefined> {
    const d = await getDB();
    return (await d.get("summaries", conversationId)) as ConversationSummary | undefined;
  },
  async putSummary(s: ConversationSummary) {
    const d = await getDB();
    await d.put("summaries", s);
  },
  async getSettings(): Promise<AppSettings> {
    const d = await getDB();
    const s = (await d.get("kv", "settings")) as AppSettings | undefined;
    return { ...DEFAULT_SETTINGS, ...(s || {}) };
  },
  async putSettings(s: AppSettings) {
    const d = await getDB();
    await d.put("kv", s, "settings");
  },
  async getFolderHandle(): Promise<FileSystemDirectoryHandle | undefined> {
    const d = await getDB();
    return (await d.get("kv", "folderHandle")) as FileSystemDirectoryHandle | undefined;
  },
  async putFolderHandle(h: FileSystemDirectoryHandle) {
    const d = await getDB();
    await d.put("kv", h, "folderHandle");
  },
  async getKV<T = unknown>(key: string): Promise<T | undefined> {
    const d = await getDB();
    return (await d.get("kv", key)) as T | undefined;
  },
  async putKV<T = unknown>(key: string, value: T) {
    const d = await getDB();
    await d.put("kv", value, key);
  },
  async clearAll() {
    const d = await getDB();
    for (const name of ["conversations", "messages", "summaries", "kv"]) {
      await d.clear(name as any);
    }
  },
};
