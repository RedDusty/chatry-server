import { cache } from "@database/cache";
import { fbFirestore } from "@database/firebase";
import { notificationsType } from "@typings/User";
import { ioType } from "custom";
import { FieldValue } from "firebase-admin/firestore";

export const notificationsGetUser = async (
  userUID: string,
  startAt: number = 0,
  limit: number = 10
) => {
  const notifications: notificationsType[] = [];
  const notifCol = await fbFirestore
    .collection("Info_Users")
    .doc(userUID)
    .collection("notifications");

  const notifData = await notifCol
    .orderBy("time", "desc")
    .startAt(startAt)
    .limit(limit)
    .get();

  notifData.forEach((notif) => {
    const notification = notif.data() as notificationsType;
    notifications.push(notification);
  });

  return notifications;
};

export const notificationsAddUser = async (
  userUID: string,
  notification: notificationsType,
  io?: ioType
) => {
  const notifCol = await fbFirestore
    .collection("Info_Users")
    .doc(userUID)
    .collection("notifications");

  notification.time = new Date().getTime();

  notifCol.add(notification);

  await fbFirestore
    .collection("Info_Users")
    .doc(userUID)
    .update({
      notifications: FieldValue.increment(1),
    });

  if (io) {
    const userIndex = cache.users.findIndex((u) => u.userUID === userUID);
    if (userIndex !== -1) {
      io.to(cache.users[userIndex].socketID).emit("CLIENT_NOTIF", notification);
    }
  }
};
