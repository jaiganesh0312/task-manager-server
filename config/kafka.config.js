const { Kafka, logLevel } = require("kafkajs");
const dotenv = require("dotenv");
dotenv.config();

const KAFKA_BROKERS = process.env.KAFKA_BROKERS;
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
    brokers: [KAFKA_BROKERS],
    logLevel: logLevel.ERROR,
    retry: {
        initialRetryTime: 100,
        retries: 3,
    },
});

const createTopics = async () => {
    const admin = kafka.admin();

    try {
        await admin.connect();
        console.log("✅ Kafka admin connected");

        const existingTopics = await admin.listTopics();

        const topicsToCreate = [];

        if (!existingTopics.includes(TOPICS.TASK_EVENTS)) {
            topicsToCreate.push({
                topic: TOPICS.TASK_EVENTS,
                numPartitions: 1,
                replicationFactor: 1,
            });
        }

        if (!existingTopics.includes(TOPICS.NOTIFICATION_EVENTS)) {
            topicsToCreate.push({
                topic: TOPICS.NOTIFICATION_EVENTS,
                numPartitions: 1,
                replicationFactor: 1,
            });
        }

        if (topicsToCreate.length > 0) {
            await admin.createTopics({
                topics: topicsToCreate,
            });

            console.log("✅ Topics created:", topicsToCreate.map(t => t.topic));
        } else {
            console.log("ℹ️ Topics already exist");
        }

        await admin.disconnect();
    } catch (error) {
        console.error("❌ Topic creation failed:", error.message);
    }
};

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
    createTopics
};
