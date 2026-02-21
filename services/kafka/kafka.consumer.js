const { kafka, TOPICS, isKafkaAvailable } = require("../../config/kafka.config");
const { Notification } = require("../../models");

let consumer = null;

/**
 * Initialize Kafka consumer
 */
const initConsumer = async () => {
    try {
        consumer = kafka.consumer({
            groupId: "notification-service",
            sessionTimeout: 30000,
            rebalanceTimeout: 60000,
            heartbeatInterval: 3000,
        });
        await consumer.connect();
        console.log("✅ Kafka consumer connected");

        // Subscribe to topics
        await consumer.subscribe({ topic: TOPICS.TASK_EVENTS, fromBeginning: false });

        // Start consuming
        await consumer.run({
            eachMessage: async ({ topic, partition, message }) => {
                await handleMessage(topic, message);
            },
        });

        console.log("✅ Kafka consumer subscribed to topic: " + TOPICS.TASK_EVENTS);

        return true;
    } catch (error) {
        console.error("❌ Kafka consumer connection failed:", error.message);
        return false;
    }
};

/**
 * Handle incoming Kafka message
 */
const handleMessage = async (topic, message) => {
    try {
        const event = JSON.parse(message.value.toString());
        console.log(`📥 Received event: ${event.type}`);

        switch (event.type) {
            case "TASK_ASSIGNED":
                await handleTaskAssigned(event.data);
                break;
            case "TASK_STATUS_CHANGED":
                await handleTaskStatusChanged(event.data);
                break;
            case "SUBTASK_ADDED":
                await handleSubtaskAdded(event.data);
                break;
            case "DEADLINE_APPROACHING":
                await handleDeadlineApproaching(event.data);
                break;
            default:
                console.log(`Unknown event type: ${event.type}`);
        }
    } catch (error) {
        console.error("Error handling Kafka message:", error.message);
    }
};

/**
 * Handle task assigned event
 */
const handleTaskAssigned = async (data) => {
    await Notification.create({
        type: "task_assigned",
        title: "New Task Assigned",
        message: `You have been assigned to task: "${data.taskTitle}" by ${data.assignerName}`,
        userId: data.assigneeId,
        metadata: {
            taskId: data.taskId,
            assignerId: data.assignerId,
        },
    });
};

/**
 * Handle task status changed event
 */
const handleTaskStatusChanged = async (data) => {
    await Notification.create({
        type: "task_status_changed",
        title: "Task Status Updated",
        message: `Task "${data.taskTitle}" status changed from ${data.previousStatus} to ${data.newStatus}`,
        userId: data.changedById,
        metadata: {
            taskId: data.taskId,
            previousStatus: data.previousStatus,
            newStatus: data.newStatus,
        },
    });
};

/**
 * Handle subtask added event
 */
const handleSubtaskAdded = async (data) => {
    await Notification.create({
        type: "subtask_added",
        title: "New Subtask Added",
        message: `Subtask "${data.subtaskTitle}" was added to task "${data.taskTitle}"`,
        userId: data.createdById,
        metadata: {
            taskId: data.taskId,
            subtaskId: data.subtaskId,
        },
    });
};

/**
 * Handle deadline approaching event
 */
const handleDeadlineApproaching = async (data) => {
    await Notification.create({
        type: "deadline_approaching",
        title: "Deadline Approaching",
        message: `Task "${data.taskTitle}" is due on ${data.dueDate}`,
        userId: data.assigneeId,
        metadata: {
            taskId: data.taskId,
            dueDate: data.dueDate,
        },
    });
};

/**
 * Disconnect consumer
 */
const disconnectConsumer = async () => {
    if (consumer) {
        await consumer.disconnect();
        console.log("Kafka consumer disconnected");
    }
};

module.exports = {
    initConsumer,
    disconnectConsumer,
};
