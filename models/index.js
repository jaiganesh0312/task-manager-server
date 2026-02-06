const { sequelize, Sequelize } = require("../config/database");

// Import models
const User = require("./User");
const Team = require("./Team");
const Project = require("./Project");
const Task = require("./Task");
const Subtask = require("./Subtask");
const Notification = require("./Notification");
const RefreshToken = require("./RefreshToken");

// ===== ASSOCIATIONS =====

// Team - User (Manager)
Team.belongsTo(User, { as: "manager", foreignKey: "managerId" });
User.hasMany(Team, { as: "managedTeams", foreignKey: "managerId" });

// Team - User (Members)
User.belongsTo(Team, { as: "team", foreignKey: "teamId" });
Team.hasMany(User, { as: "members", foreignKey: "teamId" });

// Team - Project
Project.belongsTo(Team, { as: "team", foreignKey: "teamId" });
Team.hasMany(Project, { as: "projects", foreignKey: "teamId" });

// Project - User (Creator)
Project.belongsTo(User, { as: "creator", foreignKey: "createdById" });
User.hasMany(Project, { as: "createdProjects", foreignKey: "createdById" });

// Task - Project
Task.belongsTo(Project, { as: "project", foreignKey: "projectId" });
Project.hasMany(Task, { as: "tasks", foreignKey: "projectId" });

// Task - User (Assignee)
Task.belongsTo(User, { as: "assignee", foreignKey: "assigneeId" });
User.hasMany(Task, { as: "assignedTasks", foreignKey: "assigneeId" });

// Task - User (Creator)
Task.belongsTo(User, { as: "creator", foreignKey: "createdById" });
User.hasMany(Task, { as: "createdTasks", foreignKey: "createdById" });

// Subtask - Task
Subtask.belongsTo(Task, { as: "task", foreignKey: "taskId", onDelete: "CASCADE" });
Task.hasMany(Subtask, { as: "subtasks", foreignKey: "taskId" });

// Subtask - User (Creator)
Subtask.belongsTo(User, { as: "creator", foreignKey: "createdById" });
User.hasMany(Subtask, { as: "createdSubtasks", foreignKey: "createdById" });

// Notification - User
Notification.belongsTo(User, { as: "user", foreignKey: "userId" });
User.hasMany(Notification, { as: "notifications", foreignKey: "userId" });

// RefreshToken - User
RefreshToken.belongsTo(User, { as: "user", foreignKey: "userId", onDelete: "CASCADE" });
User.hasMany(RefreshToken, { as: "refreshTokens", foreignKey: "userId" });

// Database connection test
sequelize
    .authenticate()
    .then(() => console.log("✅ Database connected successfully"))
    .catch((err) => console.error("❌ Database connection failed:", err));

module.exports = {
    sequelize,
    Sequelize,
    User,
    Team,
    Project,
    Task,
    Subtask,
    Notification,
    RefreshToken,
};