import { cache } from "@database/cache";
import { getUserDB } from "@database/handlers/getUserDB";
import { editUser, notificationsAddUser } from "@database/handlers/UserHandler";
import { UserShortType, notificationsType } from "@typings/User";
import userShortObj from "@utils/userShortObj";
import { ioType } from "custom";

export const friendRemoveUser = async (
  io: ioType,
  userSenderUID: string,
  userReceiverUID: string
) => {
  const userReceiver = await getUserDB("uid", userReceiverUID);

  const userSender = await getUserDB("uid", userSenderUID);

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
      header: "FRIEND_REMOVE",
      data: userSender
        ? ({
            avatar: userSender.avatar,
            username: userSender.username,
            online: userSender.online,
            uid: userSender.uid,
          } as UserShortType)
        : userSenderUID,
      icon: userSender ? userSender.avatar : null,
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
