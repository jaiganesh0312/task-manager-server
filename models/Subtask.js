const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");
const { v7: uuidv7 } = require("uuid");

const Subtask = sequelize.define(
    "Subtask",
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
        status: {
            type: DataTypes.ENUM("todo", "in-progress", "completed"),
            allowNull: false,
            defaultValue: "todo",
        },
        completedAt: {
            type: DataTypes.DATE,
            allowNull: true,
        },
    },
    {
        tableName: "subtasks",
        timestamps: true,
    }
);

module.exports = Subtask;
