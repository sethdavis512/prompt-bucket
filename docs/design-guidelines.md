# PromptLab Design Guidelines

## Overview

This document establishes design standards for PromptLab to ensure consistency, accessibility, and maintainability across all user interfaces. These guidelines are based on our existing TailwindCSS implementation and component library.

## Design System Foundation

### **Brand Identity**

- **Primary Brand**: 🪣 PromptBucket
- **Tagline**: Professional prompt engineering platform
- **Personality**: Clean, professional, collaborative, empowering

### **Core Values in Design**

- **Clarity**: Information hierarchy should be immediately clear
- **Efficiency**: Users should accomplish tasks with minimal friction  
- **Professionalism**: Enterprise-ready appearance and interactions
- **Collaboration**: Team-oriented features should feel inviting

## Color System

### **Primary Palette**

```css
/* Indigo - Primary Brand Color */
indigo-50:  #eef2ff
indigo-100: #e0e7ff  
indigo-500: #6366f1  
indigo-600: #4f46e5 (Primary)
indigo-700: #4338ca
indigo-900: #312e81

/* Gray - Content & UI */
gray-50:  #f9fafb (Backgrounds)
gray-100: #f3f4f6 (Light backgrounds)
gray-200: #e5e7eb (Borders)
gray-300: #d1d5db (Disabled elements)
gray-400: #9ca3af (Icons, secondary text)
gray-500: #6b7280 (Helper text)
gray-600: #4b5563 (Secondary text)  
gray-700: #374151 (Primary text)
gray-900: #111827 (Headings, emphasis)
```

### **Semantic Colors**

```css
/* Success */
green-50:  #f0fdf4
green-500: #22c55e
green-600: #16a34a

/* Warning */  
amber-50:  #fffbeb
amber-400: #f59e0b
amber-500: #d97706

/* Error */
red-50:   #fef2f2
red-400:  #f87171
red-500:  #ef4444
red-600:  #dc2626

/* Info */
blue-50:  #eff6ff
blue-400: #60a5fa
blue-600: #2563eb
```

### **Team/Pro Features**

```css
/* Pro Badge */
purple-500: #a855f7
purple-600: #9333ea

/* Team Collaboration */
indigo-500: #6366f1 (Team actions)
indigo-100: #e0e7ff (Team highlights)
```

## Typography

### **Font Stack**

- **Primary**: System font stack for optimal performance
- **Fallback**: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`

### **Type Scale**

```css
/* Headings */
text-3xl: 30px  /* Page titles */
text-2xl: 24px  /* Section headers */
text-xl:  20px  /* Card titles */
text-lg:  18px  /* Subsection headers */

/* Body Text */
text-base: 16px /* Primary body text */
text-sm:   14px /* Secondary text, labels */
text-xs:   12px /* Helper text, metadata */

/* Font Weights */
font-bold:      700 (Headings, emphasis)
font-semibold:  600 (Card titles, buttons)
font-medium:    500 (Labels, nav items)  
font-normal:    400 (Body text)
```

### **Text Colors**

```css
text-gray-900: Page titles, primary content
text-gray-700: Body text, nav items
text-gray-600: Secondary text, descriptions  
text-gray-500: Helper text, metadata
text-gray-400: Disabled text, placeholders
```

## Layout & Spacing

### **Layout Architecture**

#### **Main App Layout Structure**

The application uses a fixed sidebar + main content layout pattern with these Tailwind utility classes:

**Root Layout Container:**

```html
<div className="flex min-h-screen bg-gray-50">
```

**Fixed Top Navigation:**

```html
<nav className="fixed top-0 left-0 right-0 bg-white shadow-sm border-b border-gray-200 z-50">
  <div className="px-4 sm:px-6 lg:px-8">
    <div className="flex justify-between h-16">
```

**Desktop Sidebar:**

```html
<div className="hidden md:flex md:w-64 md:flex-col pt-16">
```

#### **⚠️ CRITICAL LAYOUT FIXES**

**❌ DO NOT USE** these problematic patterns:

```html
<!-- BROKEN - Causes width calculation issues -->
<div className="w-0 flex-1 pt-16 h-screen">

<!-- BROKEN - Missing proper structure -->
<div className="pt-16 h-screen">
```

**✅ DO USE** these correct patterns:

```html
<!-- CORRECT - Proper flex layout -->
<div className="flex flex-col flex-1 md:ml-0 pt-16 min-h-screen">
  <main className="flex-1 relative overflow-y-auto focus:outline-none">
    <div className="py-6">
      <!-- Content goes here -->
    </div>
  </main>
</div>
```

### **Mobile Navigation Patterns**

**Mobile Menu Button:**

```html
<button className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-indigo-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500">
```

**Mobile Navigation Overlay:**

```html
<div className="md:hidden fixed top-16 left-0 right-0 bg-white border-b border-gray-200 z-40">
```

**Mobile Navigation Items:**

```html
<NavLink className="flex items-center px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-indigo-700 hover:bg-indigo-50">
```

### **Container Widths**

```css
max-w-xs:   320px (Cards, modals)
max-w-sm:   384px (Forms)
max-w-md:   448px (Dialogs) 
max-w-lg:   512px (Content blocks)
max-w-2xl:  672px (Main content)
max-w-4xl:  896px (Wide layouts)
max-w-6xl: 1152px (Dashboard grids)
```

### **Spacing System**

```css
/* Micro spacing */
space-1: 4px   (Icon gaps)
space-2: 8px   (Inline elements)
space-3: 12px  (Form element gaps)

/* Component spacing */  
space-4: 16px  (Default component gap)
space-6: 24px  (Card padding, section gaps)
space-8: 32px  (Large section gaps)

/* Layout spacing */
space-12: 48px (Major section separation)
space-16: 64px (Page section gaps)
```

### **Grid Systems**

```css
/* Dashboard Stats */
grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4

/* Content Cards */  
grid-cols-1 md:grid-cols-2 gap-6

/* Team Listings */
grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6
```

## Component Guidelines

### **Buttons** (Based on existing Button.tsx)

```typescript
// Primary Actions
<Button variant="primary" size="md">Create Prompt</Button>

// Secondary Actions  
<Button variant="secondary" size="md">Cancel</Button>

// Outline (Pro features, upgrades)
<Button variant="outline" size="md">Upgrade to Pro</Button>

// Sizes
size="sm"  // 12px padding, 14px text
size="md"  // 16px padding, 14px text (default)
size="lg"  // 24px padding, 16px text
```

### **Cards**

```css
/* Standard Card */
.card {
  @apply bg-white border border-gray-200 rounded-lg shadow-sm;
}

/* Interactive Card */
.card-interactive {
  @apply bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer;
}

/* Feature Card (Pro, Team) */
.card-feature {
  @apply bg-gradient-to-r from-lime-50 to-indigo-50 border border-indigo-200 rounded-lg p-6;
}
```

### **Forms**

```css
/* Form Container */
.form-container {
  @apply space-y-6;
}

/* Input Fields */
.input {
  @apply w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm 
         focus:outline-none focus:ring-indigo-500 focus:border-indigo-500;
}

/* Input Error State */
.input-error {
  @apply border-red-500 focus:ring-red-500 focus:border-red-500;
}

/* Labels */
.label {
  @apply block text-sm font-medium text-gray-700 mb-1;
}

/* Helper Text */
.helper-text {
  @apply mt-1 text-sm text-gray-500;
}

/* Error Text */
.error-text {
  @apply mt-1 text-sm text-red-600;
}
```

### **Navigation**

```css
/* Sidebar Navigation Item */
.nav-item {
  @apply group flex items-center px-2 py-2 text-sm font-medium rounded-md
         text-gray-700 hover:text-indigo-700 hover:bg-indigo-50;
}

/* Active Navigation Item */  
.nav-item-active {
  @apply bg-indigo-50 text-indigo-700;
}

/* Disabled Navigation Item (Free users) */
.nav-item-disabled {
  @apply text-gray-400 cursor-not-allowed;
}
```

### **Badges & Status**

```css
/* Pro Badge */
.badge-pro {
  @apply inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
         bg-lime-100 text-lime-800;
}

/* Team Role Badge */
.badge-admin {
  @apply inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
         bg-blue-100 text-blue-800;
}

/* Status Indicators */
.status-success {
  @apply text-green-600 bg-green-50 border-green-200;
}

.status-warning {
  @apply text-amber-600 bg-amber-50 border-amber-200;  
}

.status-error {
  @apply text-red-600 bg-red-50 border-red-200;
}
```

## Team Feature Design Patterns

### **Team Context Indicators**

```css
/* Team Header */
.team-header {
  @apply flex items-center space-x-3 mb-6;
}

/* Team Name Display */
.team-name {
  @apply text-2xl font-bold text-gray-900;
}

/* Team Role Indicator */
.team-role {
  @apply text-sm text-gray-500 font-medium;
}
```

### **Collaboration UI**

```css
/* Team Member Avatar Group */
.avatar-group {
  @apply flex -space-x-2;
}

/* Team Stats Grid */
.team-stats {
  @apply grid grid-cols-3 gap-4 text-center;
}

/* Invitation Status */
.invitation-pending {
  @apply bg-yellow-50 border border-yellow-200 text-yellow-800;
}
```

### **Pro Feature Gating**

```css
/* Feature Gate Overlay */
.feature-gate {
  @apply absolute inset-0 bg-gray-50 bg-opacity-75 flex items-center justify-center
         rounded-lg backdrop-blur-sm;
}

/* Upgrade Prompt */
.upgrade-prompt {
  @apply bg-gradient-to-r from-lime-500 to-indigo-600 text-white p-4 rounded-lg;
}

/* Pro Feature Hint */
.pro-hint {
  @apply text-sm text-gray-500 flex items-center space-x-1;
}
```

## Responsive Design

### **Breakpoints**

```css
sm:  640px  (Mobile landscape)
md:  768px  (Tablet)  
lg:  1024px (Desktop)
xl:  1280px (Large desktop)
2xl: 1536px (Ultra-wide)
```

### **Mobile-First Patterns**

- Stack cards vertically on mobile, grid on larger screens
- Hide secondary actions in mobile, show in dropdowns
- Collapse sidebar to bottom tabs on mobile
- Full-width forms on mobile, constrained on desktop

## Accessibility Standards

### **Color Contrast**

- **Normal text**: Minimum 4.5:1 contrast ratio
- **Large text** (18px+): Minimum 3:1 contrast ratio
- **Interactive elements**: Minimum 3:1 against adjacent colors

### **Focus States**

```css
/* Standard Focus Ring */
focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2

/* Form Element Focus */
focus:ring-indigo-500 focus:border-indigo-500

/* Button Focus */  
focus:ring-indigo-500 focus:ring-offset-2
```

### **Interactive Elements**

- Minimum 44px touch target size
- Clear hover states for all clickable elements
- Loading states for async actions
- Proper ARIA labels for screen readers

## Animation & Transitions

### **Standard Transitions**

```css
/* Hover Effects */
transition-colors duration-200

/* Layout Changes */
transition-all duration-300 ease-in-out  

/* Loading Spinner */
animate-spin

/* Slide Transitions */
transform transition-transform duration-200
```

### **Micro-Interactions**

- Button hover: Color change + subtle scale
- Card hover: Shadow elevation increase
- Form focus: Border color + ring appearance
- Success actions: Green checkmark animation

## Content Guidelines

### **Microcopy Standards**

- **Buttons**: Action-oriented ("Create Team", "Invite Members")
- **Errors**: Helpful and actionable ("Team name must be at least 2 characters")
- **Empty states**: Encouraging and clear next steps
- **Feature gates**: Value-focused ("Upgrade to Pro for team collaboration")

### **Tone of Voice**

- **Professional**: Business-appropriate language
- **Helpful**: Guide users toward success
- **Efficient**: Concise, scannable content  
- **Inclusive**: Team-focused, collaborative language

## Implementation Notes

### **TailwindCSS Usage**

- Use utility classes for consistency
- Create component classes for reusable patterns
- Leverage responsive prefixes (md:, lg:)
- Use arbitrary values sparingly

### **Component Architecture**

- Build reusable components for common patterns
- Use TypeScript for prop validation
- Include proper error boundaries
- Support both light and future dark modes

### **Performance Considerations**

- Minimize custom CSS
- Use semantic HTML elements
- Optimize for Core Web Vitals
- Progressive enhancement approach

---

*These guidelines ensure PromptLab maintains a consistent, professional, and accessible user experience as we scale from individual productivity tool to enterprise team collaboration platform.*
