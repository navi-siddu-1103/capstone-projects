# Capstone Projects

A collection of full-stack development projects built to demonstrate practical software engineering skills, system design, backend development, database integration, real-time communication, and modern web technologies.

This repository contains two independent applications. Each project has its own source code, setup instructions, architecture, and documentation.

## Projects

### FS-02 — Real-Time Collaborative Workspace

A real-time collaborative document editor inspired by tools like Notion and Figma. Multiple users can work together in shared workspaces, edit documents simultaneously, view live presence, exchange comments, and manage document versions.

**Key features**
- Real-time collaborative editing using Yjs and WebSockets.
- Live user presence, cursors, and avatars.
- Workspaces, pages, and member management.
- Role-based access control.
- Comments and version history.
- PostgreSQL persistence and Redis-based collaboration scaling.

**Technology stack:** Next.js, React, TypeScript, TipTap, Yjs, Node.js, WebSockets, PostgreSQL, Prisma, Redis.

[View FS-02 documentation](./FS-02/README.md) · [View source repository](https://github.com/navi-siddu-1103/realtime-collab-workspace)

---

### FS-03 — LearnLive: Learning Management System with Live Classes

A full-stack Learning Management System designed to connect students, instructors, and administrators through online courses, video learning, assessments, and live classes.

**Key features**
- Course discovery, enrollment, and learning progress tracking.
- Video upload and processing workflow.
- Live classes using WebRTC through LiveKit.
- Quizzes, assessments, and certificate generation.
- Instructor course management and analytics.
- Admin controls, notifications, and payment integration.

**Technology stack:** MongoDB, Express.js, React, Node.js, Vite, Redux Toolkit, LiveKit, FFmpeg, AWS S3, Redis, BullMQ, Socket.IO, Razorpay.

**Live application:** [LearnLive](https://learning-management-system-live-cla.vercel.app)

[View FS-03 documentation](./FS-03/README.md) · [View source repository](https://github.com/navi-siddu-1103/learning-management-system-live-classes)

---

## Repository Structure

```text
capstone-projects/
│
├── README.md
│
├── FS-02/
│   └── README.md
│
└── FS-03/
    └── README.md
```

## Getting Started

Each project is a separate application and can be explored or executed independently.

1. Clone this repository:

   ```bash
   git clone https://github.com/navi-siddu-1103/capstone-projects.git
   ```

2. Navigate to the project you want to explore:

   ```bash
   cd capstone-projects/FS-02
   ```

   Or:

   ```bash
   cd capstone-projects/FS-03
   ```

3. Follow the installation, configuration, and execution instructions in that project's README.

## Purpose

These capstone projects demonstrate hands-on experience in building full-stack applications, integrating modern technologies, implementing backend services, managing databases, and solving practical software development challenges.

---

**Developed as part of my full-stack software development journey.**
