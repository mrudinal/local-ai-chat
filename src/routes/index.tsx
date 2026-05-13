import { createFileRoute } from "@tanstack/react-router";
import { ChatApp } from "@/components/chat/ChatApp";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Chrome GPT" },
      { name: "description", content: "ChatGPT-style chatbot running 100% locally in Chrome via the Built-in AI Prompt API. No backend, no API key." },
    ],
  }),
});

function Index() {
  return <ChatApp />;
}
