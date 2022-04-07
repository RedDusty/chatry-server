import { ioType } from "custom";
import { cache } from "@database/cache";
import { fbFirestore } from "@database/firebase";
import { notificationsType, UserShortType, UserType } from "@typings/User";
import userShortObj from "@utils/userShortObj";

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

// FRIEND REQUEST HANDLERS START

export const friendRequestSend = async (
  io: ioType,
  userSenderUID: string,
  userReceiverUID: string
) => {
  const userSender = await getUser("uid", userSenderUID);

  const userReceiver = await getUser("uid", userReceiverUID);
  
  if (userSender && userReceiver) {
    if (userReceiver.ignoresUID.indexOf(userSender.uid!) !== -1) {
      console.warn("warning - UserHandler.ts [77]");
      return false;
    }

    const newWaitingList = userReceiver.waitingsUID || [];
    newWaitingList.push(userSender.uid!);
    editUser(userReceiver.uid!, "waitingsUID", newWaitingList);
    const notif = {
      time: new Date().getTime(),
      header: "Friend request",
      data: {
        avatar: userSender.avatar,
        displayName: userSender.displayName,
        online: userSender.online,
        uid: userSender.uid,
      } as UserShortType,
    } as notificationsType;
    const userIndex = cache.users.findIndex(
      (u) => u.userUID === userReceiver.uid
    );
    if (userIndex !== -1) {
      io.to(cache.users[userIndex].socketID).emit("FRIEND_REQUEST_CLIENT", {
        header: "RECEIVE",
        user: userShortObj(userSender),
      });
    }
    notificationsAddUser(
      userSender.uid!,
      notif,
      io,
      "FRIEND_REQUEST_CLIENT_NOTIF"
    );
  }
};

export const friendAccept = async (
  io: ioType,
  userSenderUID: string,
  userReceiverUID: string
) => {
  const userReceiver = await getUser("uid", userReceiverUID);

  const userSender = await getUser("uid", userSenderUID);

  if (userReceiver && userSender) {
    const newWaitingList = (userReceiver.waitingsUID || []).filter(
      (u) => u !== userSender.uid!
    );
    editUser(userReceiver.uid!, "waitingsUID", newWaitingList);
    const notif = {
      time: new Date().getTime(),
      header: "Friend request accepted",
      data: {
        avatar: userSender.avatar,
        displayName: userSender.displayName,
        online: userSender.online,
        uid: userSender.uid,
      } as UserShortType,
    } as notificationsType;
    const userIndex = cache.users.findIndex(
      (u) => u.userUID === userReceiver.uid
    );
    if (userIndex !== -1) {
      io.to(cache.users[userIndex].socketID).emit("FRIEND_REQUEST_CLIENT", {
        header: "ACCEPT",
        user: userShortObj(userSender),
      });
    }
    notificationsAddUser(
      userSender.uid!,
      notif,
      io,
      "FRIEND_REQUEST_CLIENT_NOTIF"
    );
    friendAddUser(io, userSender, userReceiver);
    friendAddUser(io, userReceiver, userSender);
  }
};

export const friendDecline = async (
  io: ioType,
  userSenderUID: string,
  userReceiverUID: string
) => {
  const userReceiver = await getUser("uid", userReceiverUID);

  const userSender = await getUser("uid", userSenderUID);

  if (userReceiver && userSender) {
    const newWaitingList = (userReceiver.waitingsUID || []).filter(
      (u) => u !== userSender.uid!
    );
    editUser(userReceiver.uid!, "waitingsUID", newWaitingList);
    const notif = {
      time: new Date().getTime(),
      header: "Friend request declined",
      data: {
        avatar: userSender.avatar,
        displayName: userSender.displayName,
        online: userSender.online,
        uid: userSender.uid,
      } as UserShortType,
    } as notificationsType;
    const userIndex = cache.users.findIndex(
      (u) => u.userUID === userReceiver.uid
    );
    if (userIndex !== -1) {
      io.to(cache.users[userIndex].socketID).emit("FRIEND_REQUEST_CLIENT", {
        header: "DECLINE",
        user: userShortObj(userSender),
      });
    }
    notificationsAddUser(
      userSender.uid!,
      notif,
      io,
      "FRIEND_REQUEST_CLIENT_NOTIF"
    );
  }
};

export const friendAddUser = async (
  io: ioType,
  firstUser: UserType,
  secondUser: UserType
) => {
  if (firstUser && secondUser) {
    const newFriendsUID = firstUser.friendsUID;
    newFriendsUID.push(secondUser.uid!);
    editUser(firstUser.uid!, "friendsUID", newFriendsUID);
    const userIndex = cache.users.findIndex((u) => u.userUID === firstUser.uid);
    if (userIndex !== -1) {
      io.to(cache.users[userIndex].socketID).emit("FRIEND_REQUEST_CLIENT", {
        header: "ADD",
        user: secondUser.uid,
      });
    }
  }
};

export const friendRemoveUser = async (
  io: ioType,
  userSenderUID: string,
  userReceiverUID: string
) => {
  const userReceiver = await getUser("uid", userReceiverUID);

  const userSender = await getUser("uid", userSenderUID);

  if (userSender) {
    const newFriendsUID = userSender.friendsUID;
    newFriendsUID.filter((u) => u !== userReceiverUID);
    editUser(userSender.uid!, "friendsUID", newFriendsUID);
    const userIndex = cache.users.findIndex(
      (u) => u.userUID === userSender.uid
    );
    if (userIndex !== -1) {
      io.to(cache.users[userIndex].socketID).emit("FRIEND_REQUEST_CLIENT", {
        header: "REMOVE",
        user: userShortObj(userReceiver, userReceiverUID),
      });
    }
  }

  if (userReceiver) {
    const newFriendsUID = userReceiver.friendsUID;
    newFriendsUID.filter((u) => u !== userReceiverUID);
    editUser(userReceiver.uid!, "friendsUID", newFriendsUID);
    const notif = {
      time: new Date().getTime(),
      header: "Friend removed",
      data: userSender
        ? ({
            avatar: userSender.avatar,
            displayName: userSender.displayName,
            online: userSender.online,
            uid: userSender.uid,
          } as UserShortType)
        : userSenderUID,
    } as notificationsType;
    const userIndex = cache.users.findIndex(
      (u) => u.userUID === userReceiver.uid
    );
    if (userIndex !== -1) {
      io.to(cache.users[userIndex].socketID).emit("FRIEND_REQUEST_CLIENT", {
        header: "REMOVE",
        user: userShortObj(userSender, userSenderUID),
      });
    }
    notificationsAddUser(
      userReceiver.uid!,
      notif,
      io,
      "FRIEND_REQUEST_CLIENT_NOTIF"
    );
  }
};

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
