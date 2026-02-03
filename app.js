const express = require("express");
const app = express();
const dotenv = require("dotenv");
dotenv.config();

const cors = require("cors");
const morgan = require("morgan");
const { sequelize } = require("./models");

app.use(cors());
app.use(morgan("dev"));
app.use(express.json());

app.get("/", (req, res) => {
    res.send("Hello World!");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
    console.log(`Server started on port ${PORT}`);
    await sequelize.sync({ sync: true });
    console.log("Database synchronized successfully...");
});