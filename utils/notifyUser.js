const Notification = require("../models/Notification");
const { getIO } = require("../socketServer");

/**
 * Persist a notification and push it to the recipient's socket room when online.
 */
async function notifyUser({
  companyId,
  recipientId,
  senderId = null,
  type,
  title,
  message,
  relatedEntity,
  priority = "medium",
  actionUrl = null,
  metadata = {},
}) {
  if (!companyId || !recipientId || !type || !title || !message || !relatedEntity?.entityType || !relatedEntity?.entityId) {
    throw new Error("notifyUser: missing required fields");
  }

  const notification = await Notification.create({
    company: companyId,
    recipient: recipientId,
    sender: senderId || undefined,
    type,
    title,
    message,
    relatedEntity,
    priority,
    actionUrl,
    metadata,
  });

  try {
    const io = getIO();
    if (io) {
      const payload = {
        _id: notification._id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        priority: notification.priority,
        status: notification.status,
        actionUrl: notification.actionUrl,
        createdAt: notification.createdAt,
        relatedEntity: notification.relatedEntity,
      };
      io.to(recipientId.toString()).emit("new_notification", payload);
    }
  } catch (err) {
    console.warn("notifyUser socket emit failed:", err.message);
  }

  return notification;
}

module.exports = { notifyUser };
