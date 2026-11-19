import Notification from "../models/Notification.js";
import { emitToUsers } from "./realtime.service.js";

/** Creates one in-app notification and pushes it to the user's socket rooms. */
export async function createNotification({
  userId,
  type = "system",
  title,
  message = "",
  data = {},
  link = "",
}) {
  if (!userId) return null;
  const notification = await Notification.create({
    user: userId,
    type,
    title,
    message,
    data,
    link,
  });
  emitToUsers([userId], "notification:new", { notification });
  return notification;
}

/** Creates notifications for several users in a single database operation. */
export async function notifyMany(userIds, { type = "system", title, message = "", data = {}, link = "" }) {
  const recipients = [...new Set((userIds || []).filter(Boolean).map((id) => id.toString()))];
  if (!recipients.length) return [];

  const notifications = await Notification.insertMany(
    recipients.map((userId) => ({ user: userId, type, title, message, data, link })),
  );
  for (const notification of notifications) {
    emitToUsers([notification.user], "notification:new", { notification });
  }
  return notifications;
}

export default { createNotification, notifyMany };
