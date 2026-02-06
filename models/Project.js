const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");
const { v7: uuidv7 } = require("uuid");

const Project = sequelize.define(
    "Project",
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: () => uuidv7(),
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING(150),
            allowNull: false,
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        status: {
            type: DataTypes.ENUM("planning", "active", "on-hold", "completed", "cancelled"),
            allowNull: false,
            defaultValue: "planning",
        },
        priority: {
            type: DataTypes.ENUM("low", "medium", "high", "critical"),
            allowNull: false,
            defaultValue: "medium",
        },
        startDate: {
            type: DataTypes.DATEONLY,
            allowNull: true,
        },
        endDate: {
            type: DataTypes.DATEONLY,
            allowNull: true,
        },
        color: {
            type: DataTypes.STRING(7),
            allowNull: true,
            defaultValue: "#8b5cf6",
        },
    },
    {
        tableName: "projects",
        timestamps: true,
    }
);

module.exports = Project;
