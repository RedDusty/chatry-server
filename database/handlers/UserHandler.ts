import { socketType } from "custom";
import { cache } from "database/cache";
import { fbFirestore } from "database/firebase";
import { notificationsType, UserShortType, UserType } from "typings/User";

export const getUser = async <K extends keyof UserType>(
  key: K,
  value: UserType[K]
) => {
  const userDocs = await fbFirestore
    .collection("users")
    .where(key, "==", value)
    .limit(1)
    .get();

  if (userDocs.size === 0) return null;

  const userDoc = userDocs.docs[0];

  if (userDoc.exists === false) return null;

  const userInfo = userDoc.data() as UserType;

  return userInfo;
};

export const searchUser = async <K extends keyof UserType>(
  key: K,
  value: UserType[K] | string,
  userUID: string
) => {
  if (key === "subname") {
    value = String(value).toLowerCase();
  }
  const userDocs = await fbFirestore
    .collection("users")
    .where(key, ">=", value)
    .where(key, "<=", value + "\uf8ff")
    .limit(15)
    .get();

  const users: UserShortType[] = [];

  userDocs.docs.forEach((user) => {
    const docData = user.data() as UserShortType;
    if (docData.uid === userUID) return;

    const isOnline = cache.users.findIndex(
      (user) => user.userUID === docData.uid
    );

    users.push({
      avatar: docData.avatar,
      displayName: docData.displayName,
      online: isOnline !== -1 ? true : docData.online,
      uid: docData.uid,
    } as UserShortType);
  });

  return users;
};

export const friendRequest = async (
  userSendUID: string,
  userGetUID: string
) => {
  const userGet = await getUser("uid", userGetUID);

  const userSend = await getUser("uid", userSendUID);

  if (userGet && userSend) {
    const notif = {
      time: new Date().getTime(),
      header: "Friend request",
      data: userGetUID,
    } as notificationsType;
    notificationsAddUser(userGet.uid!, notif);
  }
};

export const friendAccept = async (userSendUID: string, userGetUID: string) => {
  const userGet = await getUser("uid", userGetUID);

  const userSend = await getUser("uid", userSendUID);

  if (userGet && userSend) {
    const notif = {
      time: new Date().getTime(),
      header: "Friend request accepted",
      data: userSendUID,
    } as notificationsType;
    notificationsAddUser(userSend.uid!, notif);
    // friendAddUser(userSend, userGet);
    // friendAddUser(userGet, userSend);
  }
};

export const friendDecline = async (
  userSendUID: string,
  userGetUID: string
) => {
  const userGet = await getUser("uid", userGetUID);

  const userSend = await getUser("uid", userSendUID);

  if (userGet && userSend) {
    const notif = {
      time: new Date().getTime(),
      header: "Friend request declined",
      data: userSendUID,
    } as notificationsType;
    notificationsAddUser(userSend.uid!, notif);
  }
};

// export const friendAddUser = async (userSend: UserType, userGet: UserType) => {
//   if (userGet && userSend) {
//     userGet.friendsUID.push(userSend.uid!);
//   }
// };

// export const friendRemoveUser = async (
//   userSendUID: string,
//   userGetUID: string
// ) => {
//   const userGet = await getUser("uid", userGetUID);

//   const userSend = await getUser("uid", userSendUID);

//   if (userSend) {
//     userSend.friendsUID = userSend.friendsUID.filter(
//       (uids) => uids !== userGetUID
//     );
//   }

//   if (userGet) {
//     userGet.friendsUID = userGet.friendsUID.filter(
//       (uids) => uids !== userSendUID
//     );
//     const notif = {
//       time: new Date().getTime(),
//       header: "Friend removed",
//       data: userGetUID,
//     } as notificationsType;
//     notificationsAddUser(userGet.uid!, notif);
//   }
// };

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
  notification: notificationsType
) => {
  const notifCol = await fbFirestore
    .collection("Info_Users")
    .doc(userUID)
    .collection("notifications");

  notification.time = new Date().getTime();

  notifCol.add(notification);
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
