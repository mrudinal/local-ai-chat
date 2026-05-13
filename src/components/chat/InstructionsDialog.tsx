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
            Local ChatGPT-style chat powered by Chrome Built-in AI.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 text-sm text-foreground/90 leading-relaxed">
          <p>
            This is a 100% local ChatGPT-style chatbot that runs entirely in your browser using
            Chrome Built-in AI (Gemini Nano) through the <code>LanguageModel</code> API. No API key,
            backend, or cloud AI is used.
          </p>
          <p>
            To enable it, update Chrome at <code>chrome://settings/help</code>, enable the required
            Chrome AI flags if prompted, and restart Chrome. The first time you use the app, Chrome
            may download and prepare the local model automatically.
          </p>
          <p>
            When selecting a Projects Folder in Settings, grant read and write permission so the app
            can save chats and exports to that folder.
          </p>
          <p>
            To verify everything is ready, open <code>chrome://on-device-internals</code> and use
            Settings → Check Chrome Local AI. The chatbot will work when the model status is ready
            and the availability check returns <code>"available"</code>.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}