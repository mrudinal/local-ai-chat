export type Role = "user" | "assistant" | "system";

export interface Message {
  id: string;
  conversationId: string;
  role: Role;
  content: string;
  createdAt: number;
  status: "complete" | "streaming" | "partial" | "error";
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  systemPrompt?: string;
  language?: string;
  summary?: string;
  messageIds: string[];
}

export interface ConversationSummary {
  conversationId: string;
  summary: string;
  importantFacts: string[];
  openTasks: string[];
  userPreferences: string[];
  uptoMessageId?: string;
  updatedAt: number;
}

export type ContextStrategy = "recent" | "recent+summary" | "full";

export interface AppSettings {
  theme: "system" | "light" | "dark";
  language: "es" | "en" | "auto";
  systemPrompt: string;
  contextStrategy: ContextStrategy;
  maxRecentMessages: number;
  autoSummary: boolean;
  summaryInterval: number;
}

export const DEFAULT_SETTINGS: AppSettings = {
  theme: "dark",
  language: "auto",
  systemPrompt:
    "You are a helpful, concise assistant running locally in the user's browser via Chrome Built-in AI (Gemini Nano). Format answers with Markdown when useful.",
  contextStrategy: "recent+summary",
  maxRecentMessages: 12,
  autoSummary: true,
  summaryInterval: 20,
};

// Chrome Built-in AI types (loose)
declare global {
  var LanguageModel:
    | {
        availability: (
          opts?: any,
        ) => Promise<"available" | "downloadable" | "downloading" | "unavailable">;
        create: (opts?: any) => Promise<LanguageModelSession>;
        params?: () => Promise<any>;
      }
    | undefined;
}

export interface LanguageModelSession {
  prompt: (input: string | any, opts?: any) => Promise<string>;
  promptStreaming: (
    input: string | any,
    opts?: any,
  ) => AsyncIterable<string> | ReadableStream<string>;
  destroy: () => void;
  clone?: () => Promise<LanguageModelSession>;
}

export {};
