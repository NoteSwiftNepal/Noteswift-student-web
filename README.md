# NoteSwift Student Web Portal

NoteSwift Student Web Portal is the official web-based counterpart to the NoteSwift mobile application. It is custom-tailored to provide a premium, modern dashboard environment for students to view school class timetables, enroll in courses, read chapter notes, watch recorded video lectures, submit assignments, take mock assessments, post questions to community doubt forums, and chat with an interactive AI Tutor.

## Features Built
1. **Interactive Sidebar & Navigation Shell**:
   - Dynamic topbar displaying active student identity metrics (Grade, Roll Number).
   - Sidebar menus linking all sections: Home, Course Explorer, Learn Feed, Mock Exams, Doubt Forum, Billing/Fees, Settings.
2. **Otp Bypass Authentication**:
   - Integrated mobile verification flow matching parent portal layout.
   - Built-in credentials bypass assistance (Phone: `9841234567`, OTP: `123456`).
3. **Course Explorer & Curriculum Details**:
   - Category tags search filter.
   - Expandable Drawer sheet showing modules, lesson descriptions, key features, and circular FAQs.
   - Subscription states: Enrolled, Free Trial, Upgrade.
4. **Learning Feed & Homework Center**:
   - Tabbed panels separating course content chapters from assignment task lists.
   - Checklist checkboxes that update syllabus progress bar completion ratios.
   - Built-in stubs for HTML5 video playing and PDF notes download.
   - Drag-and-drop simulated file uploader dialog.
5. **Mock Test Assessment Portal**:
   - Timed exams with live clock timer counters.
   - MCQ radio answer selections.
   - Result review pages detailing correct/incorrect selections, pass status benchmarks, and step-by-step teacher explanations.
6. **Community Doubts & AI Tutor Chat**:
   - Upvotes counters, reply comment feeds, and new question modals.
   - Session thread manager and AI assistant study buddy.
7. **Pro Billing & Invoices**:
   - connectIPS, eSewa, and Khalti payment simulators.
   - Subscription fee tracker logs.
8. **Settings & Profile Manager**:
   - Academic stream selections and emoji avatar pickers.
   - Unique parent linking code generators.

---

## Technical Stack
- **Framework**: Next.js 15 (App Router, Tailwind CSS, TypeScript)
- **Shared UI Layer**: shadcn/ui (Radix Primitives)
- **Local Dev Server Port**: `9002` (configured to match siblings)

---

## Development Setup

First, install dependencies:
```bash
npm install
```

Start the local Next.js development server:
```bash
npm run dev
```

Open [http://localhost:9002](http://localhost:9002) in your browser to view the portal.
