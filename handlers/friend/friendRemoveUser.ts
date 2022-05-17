import { cache } from "@database/cache";
import { getUserDB } from "@database/handlers/getUserDB";
import { notificationsAddUser } from "@database/handlers/notifications";
import { editUser } from "@database/handlers/UserHandler";
import { notificationsTypeServer } from "@typings/User";
import { ioType } from "custom";

export const friendRemoveUser = async (
  io: ioType,
  userSenderUID: string,
  userReceiverUID: string
) => {
  const userSender = await getUserDB("uid", userSenderUID);

  const userReceiver = await getUserDB("uid", userReceiverUID);

  if (userSender) {
    const newFriendsUID = userSender.friendsUID.filter(
      (u) => u !== userReceiverUID
    );
    editUser(userSender.uid, "friendsUID", newFriendsUID);

    const users = cache.users.filter((u) => u.userUID === userSender.uid);
    if (users.length === 1) {
      const socket = users[0].socketID;
      if (socket) {
        io.to(socket).emit("CLIENT_FRIENDS", {
          header: "FRIEND_REMOVE",
          user: userReceiverUID,
        });
      }
    }
  }

  if (userReceiver) {
    const newFriendsUID = userReceiver.friendsUID.filter(
      (u) => u !== userSenderUID
    );
    editUser(userReceiver.uid, "friendsUID", newFriendsUID);
    const users = cache.users.filter((u) => u.userUID === userReceiver.uid);
    if (users.length === 1) {
      const socket = users[0].socketID;
      if (socket) {
        io.to(socket).emit("CLIENT_FRIENDS", {
          header: "FRIEND_REQUEST",
          user: userReceiver.uid,
        });
      }
    }
    const notif = {
      time: new Date().getTime(),
      header: "FRIEND_REMOVE",
      icon: userSender?.avatar,
      userUID: userSender?.uid,
    } as notificationsTypeServer;
    notificationsAddUser(userReceiver.uid!, notif, io);
  }
};
