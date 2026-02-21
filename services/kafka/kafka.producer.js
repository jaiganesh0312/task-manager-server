const { kafka, TOPICS, isKafkaAvailable } = require("../../config/kafka.config");

let producer = null;

/**
 * Initialize Kafka producer
 */
const initProducer = async () => {
    try {
        producer = kafka.producer();
        await producer.connect();
        console.log("✅ Kafka producer connected");
        return true;
    } catch (error) {
        console.error("❌ Kafka producer connection failed:", error.message);
        return false;
    }
};

/**
 * Send event to Kafka topic
 */
const sendEvent = async (topic, eventType, data) => {
    if (!producer) {
        // Fallback: Log the event instead
        console.log(`📨 Event (no Kafka): ${eventType}`, JSON.stringify(data).substring(0, 100));
        return false;
    }

    try {
        await producer.send({
            topic,
            messages: [
                {
                    key: eventType,
                    value: JSON.stringify({
                        type: eventType,
                        data,
                        timestamp: new Date().toISOString(),
                    }),
                },
            ],
        });
        console.log(`📤 Event sent: ${eventType}`);
        return true;
    } catch (error) {
        console.error(`❌ Failed to send event ${eventType}:`, error.message);
        return false;
    }
};

/**
 * Send task assigned event
 */
const sendTaskAssignedEvent = async (task, assignee, assigner) => {
    return sendEvent(TOPICS.TASK_EVENTS, "TASK_ASSIGNED", {
        taskId: task.id,
        taskTitle: task.title,
        assigneeId: assignee.id,
        assigneeName: assignee.name,
        assignerId: assigner.id,
        assignerName: assigner.name,
    });
};

/**
 * Send task status changed event
 */
const sendTaskStatusChangedEvent = async (task, previousStatus, newStatus, changedBy) => {
    return sendEvent(TOPICS.TASK_EVENTS, "TASK_STATUS_CHANGED", {
        taskId: task.id,
        taskTitle: task.title,
        previousStatus,
        newStatus,
        changedById: changedBy.id,
        changedByName: changedBy.name,
    });
};

/**
 * Send subtask added event
 */
const sendSubtaskAddedEvent = async (subtask, task, createdBy) => {
    return sendEvent(TOPICS.TASK_EVENTS, "SUBTASK_ADDED", {
        subtaskId: subtask.id,
        subtaskTitle: subtask.title,
        taskId: task.id,
        taskTitle: task.title,
        createdById: createdBy.id,
        createdByName: createdBy.name,
    });
};

/**
 * Send deadline approaching event
 */
const sendDeadlineApproachingEvent = async (task) => {
    return sendEvent(TOPICS.TASK_EVENTS, "DEADLINE_APPROACHING", {
        taskId: task.id,
        taskTitle: task.title,
        dueDate: task.dueDate,
        assigneeId: task.assigneeId,
    });
};

/**
 * Disconnect producer
 */
const disconnectProducer = async () => {
    if (producer) {
        await producer.disconnect();
        console.log("Kafka producer disconnected");
    }
};

module.exports = {
    initProducer,
    sendEvent,
    sendTaskAssignedEvent,
    sendTaskStatusChangedEvent,
    sendSubtaskAddedEvent,
    sendDeadlineApproachingEvent,
    disconnectProducer,
};
