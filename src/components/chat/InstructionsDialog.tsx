import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const CHROME_URLS = ["chrome://settings/help", "chrome://flags/", "chrome://on-device-internals/"];

function renderLine(text: string) {
  const pattern = new RegExp(
    `(${CHROME_URLS.map((u) => u.replace(/[/.]/g, "\\$&")).join("|")})`,
    "g",
  );
  const parts = text.split(pattern);
  return parts.map((part, i) =>
    CHROME_URLS.includes(part) ? (
      <a
        key={i}
        href={part}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary underline underline-offset-2 hover:text-primary/80 break-all font-mono text-[12px]"
      >
        {part}
      </a>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}

const LINES = [
  "Chrome GPT runs 100% in your browser using Chrome Built-in AI.",
  "No backend, API key, or cloud AI is used.",
  "Required version: latest Google Chrome.",
  "Check/update Chrome here: chrome://settings/help",
  "Enable the model flag here: chrome://flags/",
  "In flags, search: Prompt API for Gemini Nano.",
  "Set it to Enabled and restart Chrome.",
  "Check model status here: chrome://on-device-internals/",
  "In Settings, choose a Projects Folder and grant read/write permission.",
  "Click Check Chrome GPT; ready means availability returns available.",
];

export function InstructionsDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>How Chrome GPT Local Chat works</DialogTitle>
        </DialogHeader>
        <ul className="text-sm leading-6 space-y-2 list-disc pl-5">
          {LINES.map((line, i) => (
            <li key={i}>{renderLine(line)}</li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
