# Admin Panel Redesign (Phase 1: Shell) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a professional, responsive admin shell for Mundo Celular using shadcn/ui sidebar patterns, including a collapsible navigation, a sticky header with breadcrumbs, and a robust layout structure.

**Architecture:** Use Next.js Route Groups `(admin)` to isolate the admin layout. The shell will consist of a `SidebarProvider` at the root, an `AppSidebar` for navigation, and a `SidebarInset` for the main content area.

**Tech Stack:** Next.js 15, Tailwind v4, Lucide React, Radix UI (Collapsible, Slot), Framer Motion.

## Global Constraints

- **Language:** Spanish (Colombia) for UI.
- **Colors:** Mundo Blue (`#143b98`) for accents, Ink Navy (`#0a1930`) for text.
- **Tokens:** Use CSS variables from `globals.css` (`--color-primary`, `--radius-cards`, etc.).
- **Typography:** Sora for headings, Inter for body.

---

### Task 1: Scaffolding the Admin Shell Structure

**Files:**
- Create: `src/components/admin/Sidebar.tsx`
- Create: `src/components/admin/SidebarHeader.tsx`
- Create: `src/components/admin/SidebarContent.tsx`
- Create: `src/components/admin/SidebarFooter.tsx`
- Modify: `src/app/admin/layout.tsx`

**Interfaces:**
- `AdminLayout`: Wraps children with `SidebarProvider` and `AdminSidebar`.
- `AppSidebar`: Main navigation component using `Sidebar` primitives.

- [ ] **Step 1: Create Sidebar UI primitives** (simplified shadcn style).
- [ ] **Step 2: Implement `AppSidebar` with basic brand header.**
- [ ] **Step 3: Update `AdminLayout` to use the new shell structure.**
- [ ] **Step 4: Verify the shell renders correctly with placeholder content.**
- [ ] **Step 5: Commit.**

### Task 2: Config-Driven Navigation

**Files:**
- Create: `src/lib/admin-navigation.ts`
- Modify: `src/components/admin/SidebarContent.tsx`

**Interfaces:**
- `navConfig`: Array of `{ title, href, icon, items? }`.

- [ ] **Step 1: Define the navigation configuration.**
- [ ] **Step 2: Implement recursive rendering in `SidebarContent` to handle nested groups.**
- [ ] **Step 3: Add active route highlighting using `usePathname()`.**
- [ ] **Step 4: Test navigation transitions between existing admin pages.**
- [ ] **Step 5: Commit.**

### Task 3: Admin Header & Breadcrumbs

**Files:**
- Create: `src/components/admin/Header.tsx`
- Create: `src/components/admin/Breadcrumbs.tsx`
- Modify: `src/app/admin/layout.tsx`

**Interfaces:**
- `AdminHeader`: Contains `SidebarTrigger` and `Breadcrumbs`.

- [ ] **Step 1: Implement `Breadcrumbs` component that auto-generates from the current path.**
- [ ] **Step 2: Create the `AdminHeader` with a sticky blur effect.**
- [ ] **Step 3: Integrate the header into `AdminLayout`.**
- [ ] **Step 4: Verify breadcrumb accuracy on deep routes (e.g., `/admin/productos/nueva`).**
- [ ] **Step 5: Commit.**

### Task 4: Responsive Mobile Drawer

**Files:**
- Modify: `src/components/admin/Sidebar.tsx`
- Modify: `src/components/admin/SidebarProvider.tsx` (if custom)

- [ ] **Step 1: Ensure the sidebar collapses to a drawer (Sheet) on mobile screens.**
- [ ] **Step 2: Test the `SidebarTrigger` functionality on small viewports.**
- [ ] **Step 3: Verify the `AdminHeader` remains functional and aesthetic on mobile.**
- [ ] **Step 4: Commit.**
