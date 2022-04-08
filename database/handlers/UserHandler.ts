import { ioType } from "custom";
import { cache } from "@database/cache";
import { fbFirestore } from "@database/firebase";
import { InfoUserType, notificationsType, UserType } from "@typings/User";

// FRIEND REQUEST HANDLERS END

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
  io?: ioType,
  ioEvent?: string
) => {
  const notifCol = await fbFirestore
    .collection("Info_Users")
    .doc(userUID)
    .collection("notifications");

  notification.time = new Date().getTime();

  notifCol.add(notification);

  if (io && ioEvent) {
    const userIndex = cache.users.findIndex((u) => u.userUID === userUID);
    if (userIndex !== -1) {
      console.log("a");

      io.to(cache.users[userIndex].socketID).emit(ioEvent, notification);
    }
  }
};

export const editUser = async <K extends keyof UserType>(
  userUID: string,
  key: K,
  value: UserType[K]
) => {
  const res = await fbFirestore
    .collection("users")
    .doc(userUID)
    .update({ [key]: value });

  return res.writeTime;
};

export const editInfoUser = async <K extends keyof InfoUserType>(
  userUID: string,
  key: K,
  value: InfoUserType[K]
) => {
  const res = await fbFirestore
    .collection("Info_Users")
    .doc(userUID)
    .update({ [key]: value });

  return res.writeTime;
};

export const addOnlineUser = async (userUID: string, socketID: string) => {
  cache.users.push({ userUID, socketID });
};

export const removeOnlineUser = async (socketID: string) => {
  const indexUser = cache.users.findIndex((user) => user.socketID === socketID);

  if (indexUser !== -1) {
    const userData = cache.users[indexUser];

    editUser(userData.userUID, "online", new Date().getTime());

    cache.users.splice(indexUser, 1);
  }
};
