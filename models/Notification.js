const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");
const { v7: uuidv7 } = require("uuid");

const Notification = sequelize.define(
    "Notification",
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: () => uuidv7(),
            primaryKey: true,
        },
        type: {
            type: DataTypes.ENUM(
                "task_assigned",
                "task_status_changed",
                "subtask_added",
                "deadline_approaching",
                "project_update",
                "team_update",
                "mention"
            ),
            allowNull: false,
        },
        title: {
            type: DataTypes.STRING(200),
            allowNull: false,
        },
        message: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        isRead: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        metadata: {
            type: DataTypes.JSONB,
            allowNull: true,
            defaultValue: {},
        },
    },
    {
        tableName: "notifications",
        timestamps: true,
    }
);

module.exports = Notification;
