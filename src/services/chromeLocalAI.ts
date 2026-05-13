import type { LanguageModelSession } from "@/types/chat";

export interface AIStatus {
  apiDetected: boolean;
  availability: "available" | "downloadable" | "downloading" | "unavailable" | "unknown";
  sessionTest: "pending" | "success" | "error";
  testPromptResult?: string;
  error?: string;
}

function getLM() {
  return (globalThis as any).LanguageModel as typeof globalThis.LanguageModel;
}

export async function checkChromeAIStatus(): Promise<AIStatus> {
  const LM = getLM();
  if (!LM) {
    return {
      apiDetected: false,
      availability: "unknown",
      sessionTest: "error",
      error: "globalThis.LanguageModel not found. Use Chrome with Built-in AI enabled.",
    };
  }
  let availability: AIStatus["availability"] = "unknown";
  try {
    availability = (await LM.availability()) as AIStatus["availability"];
  } catch (e: any) {
    return {
      apiDetected: true,
      availability: "unknown",
      sessionTest: "error",
      error: `availability() failed: ${e?.message ?? e}`,
    };
  }
  if (availability === "unavailable") {
    return { apiDetected: true, availability, sessionTest: "error", error: "Model unavailable on this device." };
  }
  try {
    const session = await LM.create({
      expectedOutputs: [{ type: "text", languages: ["es", "en"] }],
    });
    const result = await session.prompt("Reply only with OK.");
    session.destroy();
    return {
      apiDetected: true,
      availability,
      sessionTest: "success",
      testPromptResult: result,
    };
  } catch (e: any) {
    return {
      apiDetected: true,
      availability,
      sessionTest: "error",
      error: `create/prompt failed: ${e?.message ?? e}`,
    };
  }
}

export async function createChatSession(opts: { systemPrompt?: string; languages?: string[] } = {}): Promise<LanguageModelSession> {
  const LM = getLM();
  if (!LM) throw new Error("Chrome Built-in AI (LanguageModel) is not available in this browser.");
  const av = await LM.availability();
  if (av === "unavailable") throw new Error("Local model is unavailable on this device.");
  const initialPrompts = opts.systemPrompt
    ? [{ role: "system", content: opts.systemPrompt }]
    : undefined;
  const session = await LM.create({
    initialPrompts,
    expectedOutputs: [{ type: "text", languages: opts.languages ?? ["es", "en"] }],
  });
  return session;
}

export async function sendMessage(session: LanguageModelSession, prompt: string): Promise<string> {
  return session.prompt(prompt);
}

export async function* streamMessage(
  session: LanguageModelSession,
  prompt: string,
  signal?: AbortSignal,
): AsyncGenerator<string> {
  const stream = session.promptStreaming(prompt, signal ? { signal } : undefined);
  // Two flavors: ReadableStream or AsyncIterable
  const anyStream = stream as any;
  if (anyStream && typeof anyStream[Symbol.asyncIterator] === "function") {
    for await (const chunk of anyStream as AsyncIterable<string>) {
      if (signal?.aborted) return;
      yield chunk;
    }
    return;
  }
  if (anyStream && typeof anyStream.getReader === "function") {
    const reader = (anyStream as ReadableStream<string>).getReader();
    while (true) {
      if (signal?.aborted) {
        try { reader.cancel(); } catch {}
        return;
      }
      const { value, done } = await reader.read();
      if (done) return;
      if (value) yield value;
    }
  }
}

export async function summarizeConversation(text: string): Promise<{
  summary: string;
  importantFacts: string[];
  openTasks: string[];
  userPreferences: string[];
}> {
  const session = await createChatSession({
    systemPrompt:
      "You produce concise structured JSON summaries for chat history.",
  });
  try {
    const prompt = `Summarize the older part of this conversation for future context. Keep user goals, decisions, technical details, project names, unresolved tasks, preferences, code/config details, and anything needed to continue the conversation. Remove repetition and small talk. Return ONLY valid JSON with keys: summary (string), importantFacts (string[]), openTasks (string[]), userPreferences (string[]).

CONVERSATION:
${text}`;
    const raw = await session.prompt(prompt);
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return { summary: raw.slice(0, 500), importantFacts: [], openTasks: [], userPreferences: [] };
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        summary: String(parsed.summary ?? ""),
        importantFacts: Array.isArray(parsed.importantFacts) ? parsed.importantFacts.map(String) : [],
        openTasks: Array.isArray(parsed.openTasks) ? parsed.openTasks.map(String) : [],
        userPreferences: Array.isArray(parsed.userPreferences) ? parsed.userPreferences.map(String) : [],
      };
    } catch {
      return { summary: raw.slice(0, 500), importantFacts: [], openTasks: [], userPreferences: [] };
    }
  } finally {
    session.destroy();
  }
}

export async function generateConversationTitle(firstUserMessage: string): Promise<string> {
  const session = await createChatSession({
    systemPrompt: "You generate ultra-short conversation titles.",
  });
  try {
    const t = await session.prompt(
      `Generate a short conversation title, max 6 words, no quotes. Topic: ${firstUserMessage}`,
    );
    return t.replace(/^["'`]+|["'`]+$/g, "").split("\n")[0].trim().slice(0, 80) || "New chat";
  } catch {
    return firstUserMessage.slice(0, 40);
  } finally {
    session.destroy();
  }
}

export function destroySession(session: LanguageModelSession | null | undefined) {
  try {
    session?.destroy();
  } catch {}
}