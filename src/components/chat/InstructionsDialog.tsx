import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function ChromeLink({ href }: { href: string }) {
  return (
    <a
      href={href}
      onClick={(e) => {
        e.preventDefault();
        navigator.clipboard?.writeText(href);
      }}
      className="text-primary underline underline-offset-2 hover:text-primary/80 break-all font-mono text-[12px]"
      title="Click to copy (browsers block navigating to chrome:// URLs)"
    >
      {href}
    </a>
  );
}

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
          <DialogTitle>How Chrome GPT works</DialogTitle>
        </DialogHeader>

        <div className="text-sm leading-6 space-y-4">
          <section className="space-y-1">
            <p>Chrome GPT runs 100% in your browser.</p>
            <p>It uses Chrome Built-in AI.</p>
            <p>
              It uses Gemini Nano through the <code>LanguageModel</code> API.
            </p>
            <p>No backend is used.</p>
            <p>No API key is needed.</p>
            <p>No cloud AI is used.</p>
          </section>

          <section className="space-y-1">
            <h4 className="font-semibold">Required Chrome version</h4>
            <p>Use the latest Google Chrome version.</p>
            <p>Check your version here:</p>
            <ChromeLink href="chrome://settings/help" />
          </section>

          <section className="space-y-1">
            <h4 className="font-semibold">Enable the required flag</h4>
            <p>Open this page:</p>
            <ChromeLink href="chrome://flags/" />
            <p>Search for:</p>
            <p className="font-mono text-[12px]">Prompt API for Gemini Nano</p>
            <p>
              Set it to: <span className="font-medium">Enabled</span>
            </p>
            <p>Restart Chrome.</p>
          </section>

          <section className="space-y-1">
            <h4 className="font-semibold">Check the model status</h4>
            <p>Open this page:</p>
            <ChromeLink href="chrome://on-device-internals/" />
            <p>Open the Model Status tab.</p>
            <p>Wait until the local model is ready.</p>
            <p>The first setup can take several minutes.</p>
            <p>Chrome may need to download Gemini Nano.</p>
          </section>

          <section className="space-y-1">
            <h4 className="font-semibold">Folder permission</h4>
            <p>Choose a Projects Folder in Settings.</p>
            <p>Allow read and write permission.</p>
            <p>Chats will be saved there.</p>
          </section>

          <section className="space-y-1">
            <h4 className="font-semibold">Final verification</h4>
            <p>Open Settings.</p>
            <p>Click Check Chrome GPT.</p>
            <p>It is ready when availability returns:</p>
            <p className="font-mono text-[12px]">available</p>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
