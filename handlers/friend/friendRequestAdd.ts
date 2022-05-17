import { cache } from "@database/cache";
import { getUserDB } from "@database/handlers/getUserDB";
import { notificationsAddUser } from "@database/handlers/notifications";
import { editUser } from "@database/handlers/UserHandler";
import { notificationsTypeServer } from "@typings/User";
import { ioType } from "custom";
import { friendAccept } from "@handlers/friend/friendAccept";

export const friendRequestAdd = async (
  io: ioType,
  userSenderUID: string,
  userReceiverUID: string
) => {
  const userSender = await getUserDB("uid", userSenderUID);

  const userReceiver = await getUserDB("uid", userReceiverUID);

  if (userSender && userReceiver) {
    if (
      userSender.friendsUID.includes(userReceiver.uid) &&
      userReceiver.friendsUID.includes(userSender.uid)
    ) {
      return;
    }

    if (userReceiver.ignoresUID.indexOf(userSender.uid) !== -1) {
      console.warn("warning - UserHandler.ts [77]");
      return false;
    }

    if (userSender.waitingsUID.includes(userReceiver.uid)) {
      friendAccept(io, userSender, userReceiver);
    } else {
      if (userReceiver.waitingsUID.includes(userSender.uid) === true) {
        return;
      }
      const newWaitingList = userReceiver.waitingsUID || [];
      newWaitingList.push(userSender.uid);
      editUser(userReceiver.uid, "waitingsUID", newWaitingList);
      const notif = {
        time: new Date().getTime(),
        header: "FRIEND_REQUEST_ADD",
        icon: userSender.avatar,
        userUID: userSender.uid,
      } as notificationsTypeServer;
      const users = cache.users.filter((u) => u.userUID === userReceiver.uid);
      if (users.length === 1) {
        const socket = users[0].socketID;
        if (socket) {
          io.to(socket).emit("CLIENT_FRIENDS", {
            header: "FRIEND_REQUEST",
            user: userSender.uid,
          });
        }
      }
      notificationsAddUser(userReceiver.uid, notif, io);
    }
  }
};
