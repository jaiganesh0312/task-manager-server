const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");
const { v7: uuidv7 } = require("uuid");

const Task = sequelize.define(
    "Task",
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: () => uuidv7(),
            primaryKey: true,
        },
        title: {
            type: DataTypes.STRING(200),
            allowNull: false,
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        priority: {
            type: DataTypes.ENUM("low", "medium", "high", "urgent"),
            allowNull: false,
            defaultValue: "medium",
        },
        status: {
            type: DataTypes.ENUM("todo", "in-progress", "review", "completed"),
            allowNull: false,
            defaultValue: "todo",
        },
        dueDate: {
            type: DataTypes.DATEONLY,
            allowNull: true,
        },
        estimatedHours: {
            type: DataTypes.FLOAT,
            allowNull: true,
        },
        actualHours: {
            type: DataTypes.FLOAT,
            allowNull: true,
        },
        isPersonal: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        completedAt: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        tags: {
            type: DataTypes.ARRAY(DataTypes.STRING),
            allowNull: true,
            defaultValue: [],
        },
    },
    {
        tableName: "tasks",
        timestamps: true,
    }
);

module.exports = Task;
