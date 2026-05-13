import { useCallback, useEffect, useRef, useState } from "react";
import { db } from "@/services/db";
import {
  createChatSession,
  destroySession,
  generateConversationTitle,
  streamMessage,
  summarizeConversation,
} from "@/services/chromeLocalAI";
import { buildPrompt, shouldSummarize } from "@/services/contextBuilder";
import type {
  AppSettings,
  Conversation,
  ConversationSummary,
  LanguageModelSession,
  Message,
} from "@/types/chat";
import { DEFAULT_SETTINGS } from "@/types/chat";

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function useChat() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [summary, setSummary] = useState<ConversationSummary | undefined>();
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sessionRef = useRef<LanguageModelSession | null>(null);
  const sessionConvRef = useRef<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // initial load
  useEffect(() => {
    (async () => {
      const s = await db.getSettings();
      setSettings(s);
      const convs = await db.listConversations();
      setConversations(convs);
      if (convs[0]) setActiveId(convs[0].id);
    })();
  }, []);

  // load messages on conv change
  useEffect(() => {
    if (!activeId) {
      setMessages([]);
      setSummary(undefined);
      return;
    }
    (async () => {
      const msgs = await db.getMessages(activeId);
      setMessages(msgs);
      setSummary(await db.getSummary(activeId));
    })();
    // destroy session when switching
    if (sessionConvRef.current && sessionConvRef.current !== activeId) {
      destroySession(sessionRef.current);
      sessionRef.current = null;
      sessionConvRef.current = null;
    }
  }, [activeId]);

  // theme
  useEffect(() => {
    const root = document.documentElement;
    const apply = () => {
      const m = settings.theme;
      const isDark =
        m === "dark" ||
        (m === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
      root.classList.toggle("dark", isDark);
    };
    apply();
    if (settings.theme === "system") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      mq.addEventListener("change", apply);
      return () => mq.removeEventListener("change", apply);
    }
  }, [settings.theme]);

  const refreshConversations = useCallback(async () => {
    setConversations(await db.listConversations());
  }, []);

  const updateSettings = useCallback(async (s: AppSettings) => {
    setSettings(s);
    await db.putSettings(s);
    // Recreate session with new system prompt
    destroySession(sessionRef.current);
    sessionRef.current = null;
    sessionConvRef.current = null;
  }, []);

  const newChat = useCallback(async () => {
    const conv: Conversation = {
      id: uid(),
      title: "New chat",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      systemPrompt: settings.systemPrompt,
      language: settings.language,
      messageIds: [],
    };
    await db.putConversation(conv);
    await refreshConversations();
    setActiveId(conv.id);
    return conv;
  }, [settings.systemPrompt, settings.language, refreshConversations]);

  const renameConversation = useCallback(async (id: string, title: string) => {
    const c = await db.getConversation(id);
    if (!c) return;
    c.title = title || "Untitled";
    c.updatedAt = Date.now();
    await db.putConversation(c);
    await refreshConversations();
  }, [refreshConversations]);

  const deleteConversation = useCallback(async (id: string) => {
    await db.deleteConversation(id);
    if (activeId === id) {
      setActiveId(null);
    }
    await refreshConversations();
  }, [activeId, refreshConversations]);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    setIsStreaming(false);
  }, []);

  const ensureSession = useCallback(async (conv: Conversation) => {
    if (sessionRef.current && sessionConvRef.current === conv.id) return sessionRef.current;
    destroySession(sessionRef.current);
    const s = await createChatSession({
      systemPrompt: conv.systemPrompt || settings.systemPrompt,
      languages: settings.language === "auto" ? ["es", "en"] : [settings.language],
    });
    sessionRef.current = s;
    sessionConvRef.current = conv.id;
    return s;
  }, [settings.systemPrompt, settings.language]);

  const sendUserMessage = useCallback(async (text: string) => {
    if (!text.trim()) return;
    setError(null);
    let conv: Conversation | undefined;
    if (!activeId) {
      conv = await newChat();
    } else {
      conv = await db.getConversation(activeId);
    }
    if (!conv) return;

    const userMsg: Message = {
      id: uid(),
      conversationId: conv.id,
      role: "user",
      content: text,
      createdAt: Date.now(),
      status: "complete",
    };
    await db.putMessage(userMsg);
    setMessages((m) => [...m, userMsg]);

    const assistantMsg: Message = {
      id: uid(),
      conversationId: conv.id,
      role: "assistant",
      content: "",
      createdAt: Date.now() + 1,
      status: "streaming",
    };
    await db.putMessage(assistantMsg);
    setMessages((m) => [...m, assistantMsg]);

    const allMsgs = await db.getMessages(conv.id);
    const sum = await db.getSummary(conv.id);
    const prompt = buildPrompt(settings, allMsgs.slice(0, -1), sum, text);

    setIsStreaming(true);
    abortRef.current = new AbortController();
    let acc = "";
    try {
      const session = await ensureSession(conv);
      for await (const chunk of streamMessage(session, prompt, abortRef.current.signal)) {
        acc += chunk;
        setMessages((m) =>
          m.map((x) => (x.id === assistantMsg.id ? { ...x, content: acc } : x)),
        );
      }
      assistantMsg.content = acc;
      assistantMsg.status = "complete";
      await db.putMessage(assistantMsg);
    } catch (e: any) {
      assistantMsg.content = acc || `Error: ${e?.message ?? e}`;
      assistantMsg.status = "error";
      await db.putMessage(assistantMsg);
      setMessages((m) =>
        m.map((x) => (x.id === assistantMsg.id ? { ...assistantMsg } : x)),
      );
      setError(e?.message ?? String(e));
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }

    // Title generation after first user msg
    if (conv.title === "New chat" || !conv.title) {
      try {
        const t = await generateConversationTitle(text);
        conv.title = t;
      } catch {}
    }
    conv.updatedAt = Date.now();
    await db.putConversation(conv);
    await refreshConversations();

    // Auto-summary
    const after = await db.getMessages(conv.id);
    if (shouldSummarize(settings, after.length)) {
      try {
        const text = after
          .slice(0, Math.max(after.length - settings.maxRecentMessages, 0))
          .map((m) => `${m.role}: ${m.content}`)
          .join("\n");
        if (text.trim()) {
          const s = await summarizeConversation(text);
          const cs: ConversationSummary = {
            conversationId: conv.id,
            summary: s.summary,
            importantFacts: s.importantFacts,
            openTasks: s.openTasks,
            userPreferences: s.userPreferences,
            updatedAt: Date.now(),
          };
          await db.putSummary(cs);
          setSummary(cs);
        }
      } catch {}
    }
  }, [activeId, ensureSession, newChat, refreshConversations, settings]);

  const regenerateLast = useCallback(async () => {
    if (!activeId) return;
    const msgs = await db.getMessages(activeId);
    // find last assistant
    for (let i = msgs.length - 1; i >= 0; i--) {
      if (msgs[i].role === "assistant") {
        await db.deleteMessage(msgs[i].id);
        break;
      }
    }
    // find last user
    let lastUser: Message | undefined;
    const remaining = await db.getMessages(activeId);
    for (let i = remaining.length - 1; i >= 0; i--) {
      if (remaining[i].role === "user") {
        lastUser = remaining[i];
        break;
      }
    }
    setMessages(remaining);
    if (lastUser) {
      // delete the last user too so sendUserMessage re-adds it cleanly
      await db.deleteMessage(lastUser.id);
      const after = await db.getMessages(activeId);
      setMessages(after);
      await sendUserMessage(lastUser.content);
    }
  }, [activeId, sendUserMessage]);

  const editUserMessage = useCallback(async (id: string, newContent: string) => {
    if (!activeId) return;
    const msgs = await db.getMessages(activeId);
    const idx = msgs.findIndex((m) => m.id === id);
    if (idx === -1) return;
    // delete this and everything after
    for (let i = idx; i < msgs.length; i++) await db.deleteMessage(msgs[i].id);
    const after = await db.getMessages(activeId);
    setMessages(after);
    await sendUserMessage(newContent);
  }, [activeId, sendUserMessage]);

  return {
    settings,
    updateSettings,
    conversations,
    activeId,
    setActiveId,
    messages,
    summary,
    isStreaming,
    error,
    newChat,
    renameConversation,
    deleteConversation,
    sendUserMessage,
    stop,
    regenerateLast,
    editUserMessage,
    refreshConversations,
  };
}