const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");
const { v7: uuidv7 } = require("uuid");

const Team = sequelize.define(
    "Team",
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: () => uuidv7(),
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        color: {
            type: DataTypes.STRING(7),
            allowNull: true,
            defaultValue: "#6366f1",
        },
    },
    {
        tableName: "teams",
        timestamps: true,
    }
);

module.exports = Team;
