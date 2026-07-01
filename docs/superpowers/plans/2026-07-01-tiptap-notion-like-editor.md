# Tiptap Notion-Like Editor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the task detail document editor so it visually and behaviorally tracks the Tiptap Notion-like demo while preserving markdown storage and the existing task-detail application flows.

**Architecture:** Keep the existing `value -> editor -> getMarkdown() -> onChange` pipeline intact and isolate the redesign to the task detail editor shell, menus, gutter, and adjacent detail-pane chrome. The implementation should replace the current three-mode primary toolbar with a document-first editor experience and move markdown/preview into secondary affordances.

**Tech Stack:** React 19, Tiptap, Vite, Vitest, CSS

---

## File Map

- Modify: `apps/desktop/src/features/details/task-markdown-editor.tsx`
- Modify: `apps/desktop/src/features/details/task-detail-pane.tsx`
- Modify: `apps/desktop/src/features/details/task-markdown-editor.test.tsx`
- Modify: `apps/desktop/src/features/details/task-detail-pane.test.tsx`
- Modify: `apps/desktop/src/app/app-shell.test.tsx`
- Modify: `apps/desktop/src/styles/app.css`
- Modify: `apps/desktop/package.json`
- Modify: `pnpm-lock.yaml`

### Task 1: Lock regression tests around markdown persistence and the new editor entry points

**Files:**
- Modify: `apps/desktop/src/features/details/task-markdown-editor.test.tsx`
- Modify: `apps/desktop/src/features/details/task-detail-pane.test.tsx`
- Modify: `apps/desktop/src/app/app-shell.test.tsx`

- [ ] **Step 1: Write failing tests for the document-first editor shell**
- [ ] **Step 2: Run the desktop test target and verify the old UI assertions fail for the intended reasons**
- [ ] **Step 3: Update tests so they assert preserved markdown editing plus new secondary markdown/preview access**
- [ ] **Step 4: Re-run the same test target and verify only missing implementation failures remain**

### Task 2: Rebuild the task detail editor shell without changing markdown storage

**Files:**
- Modify: `apps/desktop/src/features/details/task-markdown-editor.tsx`
- Modify: `apps/desktop/src/features/details/task-detail-pane.tsx`

- [ ] **Step 1: Keep the editor markdown sync behavior and external prop sync untouched**
- [ ] **Step 2: Replace the current top toolbar with a Notion-like page chrome and document-first layout**
- [ ] **Step 3: Add left gutter actions for insert, move affordance, and per-block transform entry points**
- [ ] **Step 4: Move markdown source and preview into secondary controls without removing them**
- [ ] **Step 5: Keep all block actions mapped to markdown-safe Tiptap commands**

### Task 3: Align styling to the Tiptap Notion-like demo language

**Files:**
- Modify: `apps/desktop/src/styles/app.css`

- [ ] **Step 1: Remove the existing card-like editor framing that reads as a generic panel**
- [ ] **Step 2: Introduce a neutral document canvas, narrow readable line length, and lighter toolbar chrome**
- [ ] **Step 3: Style gutter controls, slash menu, bubble menu, and source/preview drawers to match the target language**
- [ ] **Step 4: Preserve responsive behavior for the current desktop layout**

### Task 4: Repair dependency declarations so the editor can build reproducibly

**Files:**
- Modify: `apps/desktop/package.json`
- Modify: `pnpm-lock.yaml`

- [ ] **Step 1: Add the Tiptap packages already required by the implementation**
- [ ] **Step 2: Refresh the lockfile with the same package manager version declared by the repo**
- [ ] **Step 3: Re-run build and test commands against the refreshed dependency graph**

### Task 5: Produce reviewable output and publish the feature branch

**Files:**
- Modify: working tree metadata only through git

- [ ] **Step 1: Run the desktop tests**
- [ ] **Step 2: Run the desktop build to verify the H5 surface renders**
- [ ] **Step 3: Inspect the final diff for scope drift outside the editor redesign**
- [ ] **Step 4: Commit on the feature branch and push to origin without touching `main`**
