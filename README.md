# Task Manager Pro - Backend

A scalable, enterprise-grade task management API built with Express.js, PostgreSQL, and Sequelize ORM.

## ✨ Features

- **Authentication** - JWT-based auth with access & refresh tokens
- **Role-Based Access Control** - Manager and Employee roles with granular permissions
- **Task Management** - Full CRUD with status tracking, priorities, and due dates
- **Project Tracking** - Organize tasks into projects with progress monitoring
- **Team Organization** - Create teams and manage member assignments
- **Analytics** - Productivity metrics and performance dashboards
- **Notifications** - Event-driven notification system with Kafka
- **API Validation** - Request validation with express-validator

## 🛠 Tech Stack

| Category | Technology |
|----------|------------|
| Runtime | Node.js |
| Framework | Express.js |
| Database | PostgreSQL |
| ORM | Sequelize |
| Authentication | JWT, bcryptjs |
| Validation | express-validator |
| Events | Apache Kafka (KafkaJS) |

## 📁 Project Structure

```
server/
├── config/
│   ├── database.js       # Sequelize configuration
│   └── kafka.config.js   # Kafka client setup
├── controllers/
│   ├── auth.controller.js
│   ├── user.controller.js
│   ├── team.controller.js
│   ├── project.controller.js
│   ├── task.controller.js
│   ├── subtask.controller.js
│   ├── analytics.controller.js
│   └── notification.controller.js
├── middleware/
│   ├── auth.middleware.js      # JWT verification
│   ├── rbac.middleware.js      # Role-based access
│   ├── validation.middleware.js
│   └── error.handler.js
├── models/
│   ├── User.js
│   ├── Team.js
│   ├── Project.js
│   ├── Task.js
│   ├── Subtask.js
│   ├── Notification.js
│   └── RefreshToken.js
├── routes/
│   ├── auth.routes.js
│   ├── user.routes.js
│   ├── team.routes.js
│   ├── project.routes.js
│   ├── task.routes.js
│   ├── subtask.routes.js
│   ├── analytics.routes.js
│   ├── notification.routes.js
│   └── index.js
├── services/
│   ├── auth.service.js
│   └── kafka/
│       ├── kafka.producer.js
│       └── kafka.consumer.js
├── utils/
│   └── pagination.helper.js
├── app.js
└── package.json
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Apache Kafka (optional, for notifications)

### Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/task-manager-pro-server.git
cd task-manager-pro-server

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Start the server
npm start
```

### Environment Variables

```env
# Server
PORT=5000

# Database
DB_HOST=localhost
DB_USER=postgres
DB_PASS=your_password
DB_NAME=task_manager_pro
DB_DIALECT=postgres

# JWT
JWT_SECRET=your_super_secret_key_here
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Kafka (optional)
KAFKA_BROKERS=localhost:9092
KAFKA_CLIENT_ID=task-manager-pro

#CLIENT
CLIENT_URL=your localhost or deployed url
```

## 📡 API Reference

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Register new user |
| `POST` | `/api/auth/login` | User login |
| `POST` | `/api/auth/refresh` | Refresh access token |
| `POST` | `/api/auth/logout` | Logout user |
| `GET` | `/api/auth/profile` | Get current user |
| `PUT` | `/api/auth/profile` | Update profile |

### Tasks

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/tasks` | Get all tasks |
| `GET` | `/api/tasks/:id` | Get task by ID |
| `POST` | `/api/tasks` | Create task |
| `PUT` | `/api/tasks/:id` | Update task |
| `DELETE` | `/api/tasks/:id` | Delete task |
| `PUT` | `/api/tasks/:id/status` | Update status |
| `PUT` | `/api/tasks/:id/assign` | Assign task |

### Projects

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/projects` | Get all projects |
| `POST` | `/api/projects` | Create project |
| `PUT` | `/api/projects/:id` | Update project |
| `DELETE` | `/api/projects/:id` | Delete project |

### Teams

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/teams` | Get all teams |
| `POST` | `/api/teams` | Create team |
| `POST` | `/api/teams/:id/members` | Add member |
| `DELETE` | `/api/teams/:id/members/:userId` | Remove member |

### Analytics

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/analytics/overview` | Dashboard stats |
| `GET` | `/api/analytics/productivity` | Productivity metrics |
| `GET` | `/api/analytics/trends` | Task trends |

## 🔐 Authentication

The API uses JWT tokens for authentication:

1. **Access Token** - Short-lived (15 min), used for API requests
2. **Refresh Token** - Long-lived (7 days), used to get new access tokens

Include the access token in requests:
```
Authorization: Bearer <access_token>
```

## 👥 Roles & Permissions

| Permission | Manager | Employee |
|------------|---------|----------|
| Create tasks | ✅ | ❌ |
| Edit any task | ✅ | Own only |
| Delete tasks | ✅ | ❌ |
| Assign tasks | ✅ | ❌ |
| Manage teams | ✅ | ❌ |
| View analytics | ✅ | Limited |

## 📜 License

MIT © 2024
