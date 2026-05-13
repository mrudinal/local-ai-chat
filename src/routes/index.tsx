import { createFileRoute } from "@tanstack/react-router";
import { ChatApp } from "@/components/chat/ChatApp";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Chrome GPT Local Chat" },
      {
        name: "description",
        content:
          "Frontend-only ChatGPT-style chatbot running locally in Chrome through the Built-in AI LanguageModel API.",
      },
    ],
  }),
});

function Index() {
  return <ChatApp />;
}
