const { sequelize, Sequelize } = require("../config/database")

sequelize.authenticate().
    then(() => console.log("Database connected..."))
    .catch((err) => console.log("Database connection failed...", err));

module.exports = { sequelize, Sequelize };