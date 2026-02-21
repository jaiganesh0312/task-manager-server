const { Kafka, logLevel } = require("kafkajs");

const KAFKA_BROKERS = (process.env.KAFKA_BROKERS || "localhost:9092").split(",");
const KAFKA_CLIENT_ID = process.env.KAFKA_CLIENT_ID || "task-manager-pro";

// Kafka topics
const TOPICS = {
    TASK_EVENTS: "task-events",
    NOTIFICATION_EVENTS: "notification-events",
};

// Event types
const EVENT_TYPES = {
    TASK_ASSIGNED: "TASK_ASSIGNED",
    TASK_STATUS_CHANGED: "TASK_STATUS_CHANGED",
    SUBTASK_ADDED: "SUBTASK_ADDED",
    DEADLINE_APPROACHING: "DEADLINE_APPROACHING",
    PROJECT_CREATED: "PROJECT_CREATED",
    TEAM_MEMBER_ADDED: "TEAM_MEMBER_ADDED",
};

// Create Kafka instance
const kafka = new Kafka({
    clientId: KAFKA_CLIENT_ID,
    brokers: KAFKA_BROKERS,
    logLevel: logLevel.ERROR,
    retry: {
        initialRetryTime: 100,
        retries: 3,
    },
});

// Check if Kafka is available

const checkKafkaConnection = async () => {
    try {
        const admin = kafka.admin();
        await admin.connect();
        await admin.disconnect();
        console.log("✅ Kafka connection established");
        return true;
    } catch (error) {
        console.log("⚠️ Kafka not available - running without event streaming");
        return false;
    }
};

module.exports = {
    kafka,
    TOPICS,
    EVENT_TYPES,
    checkKafkaConnection,
};
