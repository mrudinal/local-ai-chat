import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function InstructionsDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>How this chatbot works</DialogTitle>
          <DialogDescription>
            A 100% local ChatGPT-style chat that runs entirely in your browser.
          </DialogDescription>
        </DialogHeader>
        <ul className="space-y-2 text-sm text-foreground/90 list-disc pl-5">
          <li>Uses Chrome Built-in AI (Gemini Nano) via the global <code>LanguageModel</code> API.</li>
          <li>Runs locally — no API key, no backend, no cloud LLM.</li>
          <li>Chat history is stored in your browser via IndexedDB.</li>
          <li>Optionally choose a folder in Settings to save chats as JSON & Markdown.</li>
          <li>
            Verify the local model at <code>chrome://on-device-internals</code>.
          </li>
          <li>
            Update Chrome at <code>chrome://settings/help</code>.
          </li>
          <li>If the model is downloading, wait a moment and retry.</li>
          <li>If unavailable on your device, generation cannot run.</li>
        </ul>
      </DialogContent>
    </Dialog>
  );
}