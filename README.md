# WBOCS Frontend

Modern frontend client for the **Web-Based Office Communication System (WBOCS)**, built for institutional communication, administrative workflows, task management, meetings, announcements, electronic memos, and real-time messaging.

This repository contains **only the frontend application**. The backend API and database are maintained separately.

---

## 🚀 Overview

WBOCS provides a centralized communication and workflow platform for an institutional organizational hierarchy:

**Institute → Faculty → Department → Office → Staff**

The frontend provides role-specific interfaces for:

* Administrators
* Directors
* Deans
* Coordinators
* Staff

It communicates with the WBOCS backend through REST APIs and Socket.io for real-time features.

---

## ✨ Features

### 🔐 Authentication & Authorization

* User login
* Password reset and recovery
* Protected routes
* Role-based navigation
* Session management
* Role-specific layouts

### 📢 Announcements

* Institutional announcements
* Faculty and department targeting
* Announcement management
* Reader tracking

### 📝 Electronic Memos

* Official electronic memo portal
* Memo creation and dispatch
* Recipient and CC selection
* Attachment support
* Memo status tracking
* Action tracking

### 💬 Real-Time Messaging

* One-to-one messaging
* Presence status
* Typing indicators
* Read receipts
* Real-time updates through Socket.io

### 📋 Task Management

* Task delegation
* Priority management
* Due dates
* Task status tracking
* Reassignment workflows
* Task-related activity tracking

### 📅 Meetings

* Meeting scheduling
* Agenda management
* Attendee selection
* Meeting details and status

### 🏢 Organization Management

* Institutes
* Faculties
* Departments
* Offices
* Staff directory
* User and role management

### 📊 Role-Based Dashboards

Dedicated dashboards and navigation for:

| Role        | Main Responsibilities                      |
| ----------- | ------------------------------------------ |
| Admin       | System and user administration             |
| Director    | Institutional communication and management |
| Dean        | Faculty-level coordination                 |
| Coordinator | Department-level coordination              |
| Staff       | Tasks and institutional communication      |

---

## 🛠️ Technology Stack

| Technology              | Purpose                       |
| ----------------------- | ----------------------------- |
| React 19                | UI development                |
| Vite 8                  | Development and build tooling |
| JavaScript              | Application language          |
| Tailwind CSS v4         | Styling                       |
| React Router v7         | Routing and protected routes  |
| TanStack React Query v5 | Server state and caching      |
| Zustand v5              | Client state management       |
| Axios                   | HTTP communication            |
| Socket.io Client v4     | Real-time communication       |
| Radix UI                | Accessible UI primitives      |
| Lucide React            | Icons                         |
| Sonner                  | Toast notifications           |

---

## 📁 Project Structure

```text
frontend/
├── src/
│   ├── components/       # Shared UI components
│   ├── features/         # Feature/domain modules
│   │   ├── announcements/
│   │   ├── audit/
│   │   ├── auth/
│   │   ├── dashboard/
│   │   ├── departments/
│   │   ├── faculties/
│   │   ├── institutes/
│   │   ├── meetings/
│   │   ├── memos/
│   │   ├── messages/
│   │   ├── offices/
│   │   ├── settings/
│   │   ├── tasks/
│   │   └── users/
│   ├── layouts/          # Role-based layouts
│   ├── lib/              # Axios and query configuration
│   ├── routes/           # Route definitions and guards
│   └── store/            # Zustand stores
├── public/
├── .env
├── package.json
└── README.md
```

The project follows a **feature-based architecture** to keep business domains modular and maintainable.

---

## ⚙️ Requirements

Before running the project, make sure you have:

* Node.js 20+
* npm
* Git
* Running WBOCS backend API

---

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone <YOUR_FRONTEND_REPOSITORY_URL>
cd frontend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the project root:

```env
VITE_API_URL=http://localhost:5000/api/v1
VITE_SOCKET_URL=http://localhost:5000
```

Adjust the URLs according to your backend deployment.

### 4. Start development server

```bash
npm run dev
```

The application will normally be available at:

```text
http://localhost:5173
```

---

## 📜 Available Scripts

```bash
npm run dev
```

Starts the development server with hot module replacement.

```bash
npm run build
```

Creates the production build.

```bash
npm run preview
```

Previews the production build locally.

```bash
npm run lint
```

Runs ESLint checks.

---

## 🔗 Backend API

This frontend requires the WBOCS backend API.

Backend repository:

**[Add your backend GitHub repository URL here]**

The API base URL is configured through:

```env
VITE_API_URL
```

Real-time communication is configured through:

```env
VITE_SOCKET_URL
```

---

## 🔄 Application Architecture

```text
┌─────────────────────────────┐
│        WBOCS Frontend       │
│                             │
│ React + Vite + Tailwind     │
│ React Router + Query        │
│ Zustand + Axios             │
└──────────────┬──────────────┘
               │
        REST API / Socket.io
               │
               ▼
┌─────────────────────────────┐
│       WBOCS Backend         │
│                             │
│ Express + MongoDB           │
│ Authentication + RBAC       │
│ Business Logic + APIs       │
└─────────────────────────────┘
```

---

## 🔐 Security

The frontend implements security-related application controls including:

* Protected routes
* Role-based access control
* Authenticated API requests
* Session handling
* Controlled navigation
* Permission-aware UI
* Secure communication with the backend

> Authorization and final permission enforcement are handled by the backend.

---

## 📱 Responsive Design

The application is designed to provide a consistent experience across:

* Desktop
* Laptop
* Tablet
* Mobile

---

## 🧪 Development Practices

The project follows:

* Feature-based architecture
* Reusable components
* Centralized API configuration
* Server-state management with React Query
* Global client state with Zustand
* Protected routing
* Modular feature development
* ESLint-based code quality checks

---

## 📌 Project Status

**Status:** Active Development

The system is being developed as a full-stack institutional communication and workflow platform.

---

## 👨‍💻 Development

Built as part of the **Arba Minch Institute of Technology Communication System (AMITCS / WBOCS)**.

---

## 📄 License

Add the project's license here when one is selected.
