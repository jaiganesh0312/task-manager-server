const express = require("express");
const app = express();
const dotenv = require("dotenv");
const { kafka } = require("./config/kafka.config");
dotenv.config();

const cors = require("cors");
const morgan = require("morgan");
const { sequelize } = require("./models");
const routes = require("./routes");
const { notFoundHandler, errorHandler } = require("./middleware/error.handler");
const { initProducer, disconnectProducer } = require("./services/kafka/kafka.producer");
const { initConsumer, disconnectConsumer } = require("./services/kafka/kafka.consumer");

// Middleware
app.use(cors({
    origin: "http://localhost:3000",
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
}));


app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// API Routes
app.use("/api", routes);

// Root endpoint
app.get("/", (req, res) => {
    res.json({
        name: "Task Manager Pro API",
        version: "1.0.0",
        status: "running",
        documentation: "/api/health",
    });
});


// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
    console.log(`🚀 Server started on port ${PORT}`);
    console.log(`📍 API available at http://localhost:${PORT}/api`);

    try {
        await sequelize.sync({ alter: true });
        console.log("✅ Database synchronized successfully");
        // Initialize Kafka producer and consumer
        await initProducer();
        await initConsumer();
    } catch (error) {
        console.error("❌ Database sync failed:", error.message);
    }
});

// Graceful shutdown
process.on("SIGINT", async () => {
    console.log("\n🛑 Shutting down gracefully...");
    await disconnectProducer();
    await disconnectConsumer();
    process.exit(0);
});

process.on("SIGTERM", async () => {
    console.log("\n🛑 Shutting down gracefully...");
    await disconnectProducer();
    await disconnectConsumer();
    process.exit(0);
});