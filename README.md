# Project Volt

![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)
![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)
![Go](https://img.shields.io/badge/Language-Go-00ADD8.svg?logo=go&logoColor=white)
![TypeScript](https://img.shields.io/badge/Language-TypeScript-3178C6.svg?logo=typescript&logoColor=white)
[![Twitter](https://img.shields.io/badge/Twitter-tomiwa__amole-1DA1F2.svg?logo=twitter&logoColor=white)](https://twitter.com/tomiwa_amole)

Project Volt is a high-performance, local-first video editing application. It uses a sidecar architecture with a Go-powered engine running in a Web Worker via WebAssembly.

## Architecture

- **Orchestrator:** Next.js (TypeScript) main thread for UI and state.
- **Engine:** Go WASM worker thread for heavy computation.
- **Data Bridge:** Zero-copy memory sharing via `SharedArrayBuffer`.
- **Media Pipeline:** WebCodecs API for hardware-accelerated processing.

## Tech Stack

- **Frontend:** Next.js, React, Tailwind CSS
- **State:** Zustand
- **Storage:** IndexedDB (Dexie.js)
- **Engine:** Go (WASM)
- **AI:** Whisper.wasm
- **Video:** WebCodecs API

## Setup

### Prerequisites
- Node.js (v18+)
- Go (1.21+)

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/tomiwa-amole/volt.git
   cd volt
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Compile the Go Engine:
   ```bash
   GOOS=js GOARCH=wasm go build -o public/engine.wasm main.go
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```
