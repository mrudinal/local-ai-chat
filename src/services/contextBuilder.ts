import type { Message, AppSettings, ConversationSummary } from "@/types/chat";

export function buildPrompt(
  settings: AppSettings,
  messages: Message[],
  summary: ConversationSummary | undefined,
  userInput: string,
): string {
  const parts: string[] = [];
  if (summary && settings.contextStrategy !== "recent") {
    parts.push("=== Conversation summary ===");
    if (summary.summary) parts.push(summary.summary);
    if (summary.importantFacts?.length) parts.push("Important facts:\n- " + summary.importantFacts.join("\n- "));
    if (summary.openTasks?.length) parts.push("Open tasks:\n- " + summary.openTasks.join("\n- "));
    if (summary.userPreferences?.length) parts.push("User preferences:\n- " + summary.userPreferences.join("\n- "));
  }
  const recent =
    settings.contextStrategy === "full"
      ? messages
      : messages.slice(-settings.maxRecentMessages);
  if (recent.length) {
    parts.push("=== Recent messages ===");
    for (const m of recent) {
      if (m.role === "system") continue;
      parts.push(`${m.role === "user" ? "User" : "Assistant"}: ${m.content}`);
    }
  }
  parts.push(`User: ${userInput}\nAssistant:`);
  return parts.join("\n\n");
}

export function shouldSummarize(settings: AppSettings, messageCount: number) {
  return (
    settings.autoSummary &&
    messageCount > 0 &&
    messageCount % settings.summaryInterval === 0
  );
}