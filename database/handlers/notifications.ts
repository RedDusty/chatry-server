import { cache } from "@database/cache";
import { fbFirestore } from "@database/firebase";
import {
  notificationsTypeClient,
  notificationsTypeServer,
} from "@typings/User";
import { ioType } from "custom";
import { FieldValue } from "firebase-admin/firestore";
import { getUserDB } from "@database/handlers/getUserDB";

export const notificationsGetUser = async (
  userUID: string,
  startAt: number = 0,
  limit: number = 10
) => {
  const notifications: notificationsTypeClient[] = [];

  const notifDoc = await fbFirestore
    .collection("Info_Users")
    .doc(userUID)
    .collection("notifications")
    .orderBy("time", "desc")
    .limit(10)
    .get();

  for (let idx = 0; idx < notifDoc.size; idx++) {
    const notif = notifDoc.docs[idx];
    const notifServer = notif.data() as notificationsTypeServer;

    const notifClient: notificationsTypeClient = {
      data: notifServer.data,
      header: notifServer.header,
      time: notifServer.time,
      icon: notifServer.icon,
    };

    if (notifServer.userUID) {
      const user = await getUserDB("uid", notifServer.userUID);

      if (user) {
        notifClient.user = {
          uid: user.uid,
          username: user.username,
        };
        notifClient.icon = user.avatar;

        notifications.push(notifClient);
      } else {
        notifClient.user = undefined;
        notifClient.icon = undefined;

        notifications.push(notifClient);
      }
    } else {
      notifications.push(notifClient);
    }
  }

  return notifications;
};

export const notificationsAddUser = async (
  userUID: string,
  notification: notificationsTypeServer,
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
    const users = cache.users.filter((u) => u.userUID === userUID);
    const socket = users.length === 1 ? users[0].socketID : null;

    const notifClient: notificationsTypeClient = {
      data: notification.data,
      header: notification.header,
      time: notification.time,
      icon: notification.icon,
    };

    if (notification.userUID) {
      const user = await getUserDB("uid", notification.userUID);

      if (user) {
        notifClient.user = {
          uid: user.uid,
          username: user.username,
        };
        notifClient.icon = user.avatar;
      } else {
        notifClient.user = undefined;
        notifClient.icon = undefined;
      }
    }

    if (socket) {
      io.to(socket).emit("CLIENT_NOTIF", notifClient);
    }
  }
};
