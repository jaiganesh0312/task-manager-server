const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const RefreshToken = sequelize.define(
    "RefreshToken",
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        token: {
            type: DataTypes.STRING(500),
            allowNull: false,
            unique: true,
        },
        expiresAt: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        isRevoked: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
    },
    {
        tableName: "refresh_tokens",
        timestamps: true,
    }
);

// Class method to clean up expired tokens
RefreshToken.cleanupExpired = async function () {
    const now = new Date();
    await this.destroy({
        where: {
            expiresAt: {
                [require("sequelize").Op.lt]: now,
            },
        },
    });
};

module.exports = RefreshToken;
