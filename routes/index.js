const express = require("express");
const router = express.Router();

// Import route modules
const authRoutes = require("./auth.routes");
const userRoutes = require("./user.routes");
const teamRoutes = require("./team.routes");
const projectRoutes = require("./project.routes");
const taskRoutes = require("./task.routes");
const subtaskRoutes = require("./subtask.routes");
const analyticsRoutes = require("./analytics.routes");
const notificationRoutes = require("./notification.routes");

// Mount routes
router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/teams", teamRoutes);
router.use("/projects", projectRoutes);
router.use("/tasks", taskRoutes);
router.use("/", subtaskRoutes); // Subtasks are nested under tasks and also have direct routes
router.use("/analytics", analyticsRoutes);
router.use("/notifications", notificationRoutes);

// Health check
router.get("/health", (req, res) => {
    res.json({
        success: true,
        message: "Task Manager Pro API is running",
        timestamp: new Date().toISOString(),
    });
});

module.exports = router;
