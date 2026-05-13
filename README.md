# Chrome GPT Local Chat

A frontend-only ChatGPT-style chatbot that uses Chrome Built-in AI / Gemini Nano through the LanguageModel API.

## Features

- Local Chrome AI
- No backend
- No API keys
- Streaming responses
- IndexedDB chat history
- Save/export chats to a selected folder
- Instructions modal
- Settings modal
- Chrome AI diagnostics
- Markdown/code rendering

## Requirements

- Latest Google Chrome
- Prompt API for Gemini Nano enabled
- Gemini Nano downloaded/ready
- HTTPS or `localhost`

## Setup

```bash
pnpm install
pnpm dev
```

## Build

```bash
pnpm build
pnpm preview
```

## Chrome setup

1. Update Chrome at `chrome://settings/help`
2. Open `chrome://flags/`
3. Search for `Prompt API for Gemini Nano`
4. Enable it and restart Chrome
5. Check model status at `chrome://on-device-internals/`
6. In the app, open `Settings`
7. Choose a Projects Folder and grant read/write permission
8. Click `Check Chrome GPT`

## What the app does

Chrome GPT Local Chat keeps the same architecture as the current project: a frontend-only local chatbot that runs entirely in Chrome. It uses Chrome's local `LanguageModel` API for generation, stores chat data in IndexedDB, and optionally saves conversation files to a folder you select with the File System Access API.

The app supports:

- Multiple conversations
- Streaming assistant replies
- Editable chat titles
- Regenerate and edit/resend flows
- Persistent settings and system prompt
- Local context summaries for longer chats
- Export of all chats as text
- Per-chat save to JSON and Markdown

## Public repo disclaimer

This app only works where Chrome Built-in AI and `LanguageModel` are available.

The model runs locally in the user's browser.

No prompts are sent to a backend by this app.

## Screenshots

Screenshots coming soon.

## License

This project is licensed under the MIT License. See [LICENSE](./LICENSE).
