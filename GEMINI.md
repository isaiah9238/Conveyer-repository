# Conveyer: Design & Brainstorming

This document captures the core vision, feature ideas, and technical brainstorming for the Conveyer application.

## 1. Core Vision: A Desktop Organism

The goal is not to build a basic notepad, but a floating, ambient, AI-augmented thought companion. It should behave more like a living organism than a static app—a little cube that sits on the screen, expands when needed, dissolves when done, and remembers or forgets intelligently.

---

## 2. Feature Breakdown

### Core Experience (Requires Desktop Shell like Electron)

*   **Always-on-top:** The note window should float above all other applications.
*   **Fold-down "Dock Cube":** A minimal 120x120px state for when the note is not in active use. It can animate with Tailwind transitions (full panel ↔ collapsed cube).
*   **Transparency on Command:** Allow the user to control opacity via a slider or toggle for "ghost mode."
*   **Dissolving Text:** A poetic visual effect for "forgetting" notes, using CSS animations to fade, blur, and dissolve the text.

### Preventing UI Chaos ("The Desktop Hydra")

To avoid overwhelming the user with too many windows, we should implement:

*   **A Global Command Center:** A single, accessible control panel (via icon or shortcut) to manage all notes (close all, hide all, reset positions).
*   **Hard Limit on Windows:** A configurable maximum number of concurrent note windows.
*   **Auto-Collapse When Idle:** Notes should shrink back to their "dock cube" state after a period of inactivity.
*   **"Show All / Hide All" Toggle:** A simple way to manage screen clutter.
*   **Emergency Escape Hatch:** A global keyboard shortcut (e.g., `Ctrl+Shift+X`) to instantly close all notes.
*   **"Zen Mode":** A single click to dissolve all notes, leaving a clean screen.

---

## 3. AI Function Map

This roadmap outlines the planned AI capabilities for Conveyer.

#### 🧠 Core Content Functions
*   **Summarization:** Summarize selected text, the entire note, or multiple notes into a digest.
*   **Rewrite / Clean Up:** Turn messy notes into clean paragraphs or convert shorthand into full sentences.
*   **Task Extraction:** Pull out to-do items from notes and create a checklist.
*   **Explain / Clarify:** Explain a concept in simple terms or break down complex ideas.
*   **Continue Writing:** Expand on a thought or suggest next steps.
*   **Style Transformation:** Turn notes into bullet points, prose, or outlines.

#### 🧬 Organizational & Memory Functions
*   **Auto-Tagging:** Automatically detect topics and assign tags to group notes.
*   **Memory Modes:**
    *   **Remember:** Save important notes, perhaps compressing them into "memory seeds."
    *   **Forget:** Visually dissolve text and decide whether to delete it permanently or archive a summary.
*   **Duplicate Mode:** Clone a note into a new floating panel for parallel brainstorming.

#### 🔥 Creative & Ideation Functions
*   **Spark Mode:** Suggest new ideas, improvements, or connections based on the note's content.

#### 🧊 Bonus Feature Ideas
*   **"Freeze Frame":** Lock a note in place (no edits, no dissolving) for reference.
*   **"Feather Mode":** An ultra-light, non-intrusive mode showing only keywords.

---

## 4. Technical Notes: What is Electron?

Electron is a framework for building desktop applications using web technologies (HTML, CSS, JavaScript). It's what makes features like `alwaysOnTop`, `transparent` windows, and `click-through` modes possible, as these are not allowed by standard web browsers. It acts as a "wrapper" for the Next.js application, giving it desktop superpowers.
