import { cache } from "@database/cache";
import { getUserDB } from "@database/handlers/getUserDB";
import { notificationsAddUser } from '@database/handlers/notifications';
import { editUser } from "@database/handlers/UserHandler";
import { notificationsType } from '@typings/User';
import userShortObj from "@utils/userShortObj";
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
    const userIndex = cache.users.findIndex(
      (u) => u.userUID === userSender.uid
    );
    if (userIndex !== -1) {
      io.to(cache.users[userIndex].socketID).emit("CLIENT_FRIENDS", {
        header: "FRIEND_REMOVE",
        user: userReceiverUID,
      });
    }
  }

  if (userReceiver) {
    const newFriendsUID = userReceiver.friendsUID.filter(
      (u) => u !== userSenderUID
    );
    editUser(userReceiver.uid, "friendsUID", newFriendsUID);
    const userIndex = cache.users.findIndex(
      (u) => u.userUID === userReceiver.uid
    );
    if (userIndex !== -1) {
      io.to(cache.users[userIndex].socketID).emit("CLIENT_FRIENDS", {
        header: "FRIEND_REMOVE",
        user: userSenderUID,
      });
    }
    const notif = {
      time: new Date().getTime(),
      header: "FRIEND_REMOVE",
      data: userShortObj(userSender, userSenderUID),
      icon: userSender ? userSender.avatar : null,
    } as notificationsType;
    notificationsAddUser(
      userReceiver.uid!,
      notif,
      io
    );
  }
};
