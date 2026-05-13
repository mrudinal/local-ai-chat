# Chrome GPT

Chrome GPT is a ChatGPT-style web app that runs entirely in your browser using Chrome Built-in AI. It does not send prompts to a backend, does not require an API key, and does not depend on a cloud model for normal chat usage.

This project is built with React, TanStack Start, TanStack Router, React Query, Tailwind CSS, and Cloudflare/Vite tooling. The AI layer uses Chrome's local `LanguageModel` or `ai.languageModel` Prompt API, which is exposed by recent versions of Google Chrome when the correct Built-in AI features are enabled.

## What this project does

The app provides a local chat interface with conversation history, editable settings, and export/save options.

Key capabilities:

- Runs prompts against Chrome Built-in AI in the browser.
- Streams assistant responses as they are generated.
- Stores chats, summaries, and settings locally in IndexedDB.
- Creates and manages multiple conversations.
- Renames, deletes, edits, and regenerates messages.
- Supports English, Spanish, or automatic output language selection.
- Lets you define a persistent system prompt/persona.
- Summarizes older messages to preserve context in longer chats.
- Exports all chats as a single `.txt` download.
- Saves the current chat to a user-selected folder when File System Access is available.

## How it works

At a high level:

1. The user enters a message in the chat UI.
2. The app loads the current conversation and any saved summary from IndexedDB.
3. A prompt is built from recent messages, and optionally a generated conversation summary.
4. The app creates or reuses a Chrome local AI session.
5. The response is streamed into the UI in real time.
6. The chat is stored locally, and the conversation may be auto-summarized after a configurable message interval.

The app does not include a traditional server-side AI pipeline. The TanStack Start server entry exists for app hosting and SSR/error handling, but the model interaction itself happens in the browser through Chrome's local AI runtime.

## Main features in the UI

### Chat screen

- Start a new chat from the sidebar.
- Search existing conversations by title.
- Rename the active conversation from the top bar or sidebar.
- Delete conversations from the sidebar.
- Send prompts and watch responses stream live.
- Stop a streaming response.
- Edit a previous user message to rewrite the conversation from that point.
- Regenerate the last assistant response.

### Settings

The Settings dialog includes:

- Theme: `system`, `light`, or `dark`
- Default language: `auto`, `en`, or `es`
- System instructions/persona
- Context strategy:
  - `recent`: recent messages only
  - `recent+summary`: recent messages plus a saved summary of older context
  - `full`: full conversation until the app-defined prompt construction reaches all messages
- Max recent messages
- Auto-summary toggle
- Summary interval in messages
- Projects folder selection and permission verification
- Chrome GPT diagnostics check
- Clear all local data

### Instructions dialog

The app includes a built-in "How Chrome GPT works" dialog. Its setup guidance is reflected below and should be followed before expecting the model to be available.

## Chrome requirements and setup

This app depends on Chrome Built-in AI being available on the device and on the current browser origin being trusted.

### Requirements

- Latest Google Chrome
- Chrome Built-in AI enabled
- A supported local model state on the device
- A secure context: `https://...` or `http://localhost/...`

### Required setup steps

These steps come directly from the app's instructions flow and are consistent with the code's runtime checks:

1. Update Chrome.
   - Open `chrome://settings/help`
2. Enable the Built-in AI model flag.
   - Open `chrome://flags/`
   - Search for `Prompt API for Gemini Nano`
   - Set it to `Enabled`
   - Restart Chrome
3. Check model/device status.
   - Open `chrome://on-device-internals/`
4. Open this app from a trusted origin.
   - Prefer `http://localhost:...` for local development
   - Avoid opening it from a private IP over plain HTTP if Chrome marks that origin as insecure
5. In the app's Settings dialog:
   - Choose a Projects Folder
   - Grant read/write permission
   - Click `Check Chrome GPT`
6. Verify readiness.
   - The ideal result is that availability reports `available`

### Why localhost matters

The app checks `window.isSecureContext`. If the app is opened on an insecure origin, Chrome Built-in AI may not be exposed even if Chrome is otherwise configured correctly. The app can suggest switching from a private LAN IP to `localhost` when possible.

## Using the app

### Daily usage

1. Start the app locally.
2. Open it in Chrome.
3. Open `Settings`.
4. Click `Check Chrome GPT`.
5. If available, start a new chat and send prompts.
6. Optionally customize:
   - system prompt
   - language
   - context strategy
   - summary behavior
7. Save or export your chats when needed.

### Saving and exporting

There are two slightly different output paths in the current code:

- `Save`
  - If a folder has been selected and permission is granted, the current conversation is written into that folder.
  - If no folder is configured, the app downloads the current chat as both `.json` and `.md`.
- `Export`
  - Exports all conversations as a single `.txt` download.

When folder saving is enabled, the app creates a structure like:

```text
<Selected Folder>/
  ChromeLocalAIChat/
    projects.json
    chats/
      <chat-title>__<timestamp>/
        chat.json
        messages.json
        chat.md
        summary.json
```

Notes:

- `summary.json` is written only when a summary exists.
- Chat folder names are sanitized from the conversation title and timestamped on first save.
- A persistent folder handle is stored locally in IndexedDB.

## Data storage and privacy

This project is designed to be local-first.

What stays local:

- conversations
- messages
- summaries
- app settings
- selected folder handle metadata

Where local data is stored:

- IndexedDB database: `chrome-local-ai-chat`
- Optional filesystem folder chosen by the user via the File System Access API

The app code indicates no backend is required for chatting. Responses are generated by Chrome's local AI APIs, and chat data is persisted in the browser unless the user explicitly exports or saves it to disk.

## Project structure

Important files and what they do:

- `src/components/chat/ChatApp.tsx`
  - Main chat layout and top-level UI actions
- `src/components/chat/SettingsDialog.tsx`
  - Settings UI, diagnostics, folder selection
- `src/components/chat/InstructionsDialog.tsx`
  - Built-in setup instructions for Chrome GPT
- `src/hooks/useChat.ts`
  - Core chat state, session lifecycle, message flow, autosummary logic
- `src/services/chromeLocalAI.ts`
  - Chrome AI detection, diagnostics, session creation, streaming, title generation, summarization
- `src/services/contextBuilder.ts`
  - Builds prompts from recent messages and saved summaries
- `src/services/db.ts`
  - IndexedDB persistence for chats, summaries, settings, and folder handle
- `src/services/folder.ts`
  - Save/export logic using the File System Access API and browser downloads
- `src/routes/index.tsx`
  - App entry route
- `src/router.tsx`
  - TanStack Router configuration
- `src/start.ts`
  - TanStack Start app setup
- `src/server.ts`
  - Server entry wrapper used by TanStack Start / Cloudflare build flow

## Development

### Install dependencies

The repo currently includes both `bun.lock` and `pnpm-lock.yaml`, but the project scripts are standard Vite scripts, so any of the common package managers can work if the dependency tree is installed consistently.

Examples:

```bash
pnpm install
pnpm dev
```

or

```bash
bun install
bun run dev
```

or

```bash
npm install
npm run dev
```

### Available scripts

- `dev` - start the Vite dev server
- `build` - production build
- `build:dev` - build in development mode
- `preview` - preview the built app
- `lint` - run ESLint
- `format` - run Prettier

## Technical behavior worth knowing

### Model session handling

- The app creates a local AI session per active conversation.
- Switching conversations destroys the previous session.
- Changing settings recreates the session so a new system prompt can take effect.

### Prompt construction

The prompt builder combines:

- an optional saved summary of older conversation context
- recent messages, or the full message list depending on settings
- the current user input

This keeps long chats usable even when older messages are summarized.

### Auto-generated titles

After the first user message in a new chat, the app asks the local model to generate a short title for the conversation.

### Auto-summary

If enabled, the app summarizes older messages every `summaryInterval` messages. The stored summary includes:

- summary text
- important facts
- open tasks
- user preferences

## Troubleshooting

### "Chrome Built-in AI was not detected"

Check all of the following:

- You are using Google Chrome, not another browser.
- Chrome is up to date.
- `Prompt API for Gemini Nano` is enabled in `chrome://flags/`.
- You restarted Chrome after enabling the flag.
- The app is opened on `localhost` or HTTPS.
- `chrome://on-device-internals/` shows the model is ready or available.

### Availability is `downloadable` or `downloading`

Chrome may still be preparing the local model. Open `chrome://on-device-internals/` and wait for the model to finish downloading or initializing.

### Folder saving does not work

Check:

- You selected a folder in Settings.
- The browser supports `showDirectoryPicker`.
- Read/write permission is granted.
- You clicked `Verify Folder Permission`.

If folder access is unavailable, the app still supports browser downloads for individual saves and full-text export.

### The app works on one URL but not another

That is expected if one origin is trusted and the other is not. This app explicitly checks whether the current origin is a secure context, and Chrome's local AI APIs may be hidden on insecure origins.

## Summary

Chrome GPT is a local-first chat app for Chrome Built-in AI. It gives you a familiar multi-conversation chat interface, local persistence, prompt customization, context summarization, and export/save tools without requiring a cloud backend or API key.
