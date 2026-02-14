const { Task, Subtask } = require("../models");

/**
 * RBAC Permissions for Task-Manager-Pro
 * 
 * Manager Permissions:
 * - Create, edit, delete tasks
 * - Assign tasks to employees
 * - Create and manage projects
 * - Create teams and assign projects
 * - View analytics and reports
 * - View all team and project tasks
 * 
 * Employee Permissions:
 * - View assigned tasks
 * - Update task status (Todo / In Progress / Completed)
 * - Cannot edit or delete tasks assigned by manager
 * - Can create and manage subtasks under assigned tasks
 * - Same restrictions apply to subtasks
 * - Create and manage Personal Tasks
 */

/**
 * Check if user can create a task
 * Only Managers can create project tasks
 * Employees can only create personal tasks
 */
const canCreateTask = (req, res, next) => {
    const { isPersonal } = req.body;

    if (req.user.role === "manager") {
        return next();
    }

    // Employees can only create personal tasks
    if (req.user.role === "employee" && isPersonal !== true) {
        return res.status(403).json({
            success: false,
            message: "Employees can only create personal tasks",
        });
    }

    next();
};

/**
 * Check if user can edit a task
 * Manager: Can edit any task in their team
 * Employee: Can only edit their own personal tasks
 */
const canEditTask = async (req, res, next) => {
    try {
        const { id } = req.params;
        const task = await Task.findByPk(id);

        if (!task) {
            return res.status(404).json({
                success: false,
                message: "Task not found",
            });
        }

        if (req.user.role === "manager") {
            req.task = task;
            return next();
        }

        // Employees can only edit their own personal tasks
        if (task.isPersonal && task.createdById === req.user.id) {
            req.task = task;
            return next();
        }

        return res.status(403).json({
            success: false,
            message: "You can only edit your own personal tasks",
        });
    } catch (error) {
        console.error("canEditTask error:", error);
        return res.status(500).json({
            success: false,
            message: "Permission check failed",
        });
    }
};

/**
 * Check if user can delete a task
 * Same rules as canEditTask
 */
const canDeleteTask = async (req, res, next) => {
    return canEditTask(req, res, next);
};

/**
 * Check if user can update task status
 * Manager: Can update any task status
 * Employee: Can only update status of tasks assigned to them
 */
const canUpdateTaskStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const task = await Task.findByPk(id);

        if (!task) {
            return res.status(404).json({
                success: false,
                message: "Task not found",
            });
        }

        if (req.user.role === "manager") {
            req.task = task;
            return next();
        }

        // Employees can update status of assigned tasks or personal tasks
        if (
            task.assigneeId === req.user.id ||
            (task.isPersonal && task.createdById === req.user.id)
        ) {
            req.task = task;
            return next();
        }

        return res.status(403).json({
            success: false,
            message: "You can only update status of tasks assigned to you",
        });
    } catch (error) {
        console.error("canUpdateTaskStatus error:", error);
        return res.status(500).json({
            success: false,
            message: "Permission check failed",
        });
    }
};

/**
 * Check if user can assign a task
 * Only Managers can assign tasks
 */
const canAssignTask = (req, res, next) => {
    if (req.user.role !== "manager") {
        return res.status(403).json({
            success: false,
            message: "Only managers can assign tasks",
        });
    }
    next();
};

/**
 * Check if user can create subtask
 * Manager: Can create subtasks on any task
 * Employee: Can only create subtasks on tasks assigned to them
 */
const canCreateSubtask = async (req, res, next) => {
    try {
        const { taskId } = req.params;
        const task = await Task.findByPk(taskId);

        if (!task) {
            return res.status(404).json({
                success: false,
                message: "Task not found",
            });
        }

        if (req.user.role === "manager") {
            req.task = task;
            return next();
        }

        // Employees can create subtasks on assigned tasks or personal tasks
        if (
            task.assigneeId === req.user.id ||
            (task.isPersonal && task.createdById === req.user.id)
        ) {
            req.task = task;
            return next();
        }

        return res.status(403).json({
            success: false,
            message: "You can only create subtasks on tasks assigned to you",
        });
    } catch (error) {
        console.error("canCreateSubtask error:", error);
        return res.status(500).json({
            success: false,
            message: "Permission check failed",
        });
    }
};

/**
 * Check if user can edit/delete subtask
 */
const canModifySubtask = async (req, res, next) => {
    try {
        const { id } = req.params;
        const subtask = await Subtask.findByPk(id, {
            include: [{ model: Task, as: "task" }],
        });

        if (!subtask) {
            return res.status(404).json({
                success: false,
                message: "Subtask not found",
            });
        }

        const task = subtask.task;

        if (req.user.role === "manager") {
            req.subtask = subtask;
            return next();
        }

        // Employees can modify subtasks they created on assigned/personal tasks
        if (
            subtask.createdById === req.user.id &&
            (task.assigneeId === req.user.id ||
                (task.isPersonal && task.createdById === req.user.id))
        ) {
            req.subtask = subtask;
            return next();
        }

        return res.status(403).json({
            success: false,
            message: "You can only modify subtasks you created on your assigned tasks",
        });
    } catch (error) {
        console.error("canModifySubtask error:", error);
        return res.status(500).json({
            success: false,
            message: "Permission check failed",
        });
    }
};

/**
 * Check if user can manage team
 * Only Managers can create/edit/delete teams
 */
const canManageTeam = (req, res, next) => {
    if (req.user.role !== "manager") {
        return res.status(403).json({
            success: false,
            message: "Only managers can manage teams",
        });
    }
    next();
};

/**
 * Check if user can manage project
 * Only Managers can create/edit/delete projects
 */
const canManageProject = (req, res, next) => {
    if (req.user.role !== "manager") {
        return res.status(403).json({
            success: false,
            message: "Only managers can manage projects",
        });
    }
    next();
};

/**
 * Check if user can view analytics
 * Only Managers can view full analytics
 */
const canViewAnalytics = (req, res, next) => {
    if (req.user.role !== "manager") {
        return res.status(403).json({
            success: false,
            message: "Only managers can view analytics",
        });
    }
    next();
};

module.exports = {
    canCreateTask,
    canEditTask,
    canDeleteTask,
    canUpdateTaskStatus,
    canAssignTask,
    canCreateSubtask,
    canModifySubtask,
    canManageTeam,
    canManageProject,
    canViewAnalytics,
};
