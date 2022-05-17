import { cache } from "@database/cache";
import { getUserDB } from "@database/handlers/getUserDB";
import { notificationsAddUser } from "@database/handlers/notifications";
import { editUser } from "@database/handlers/UserHandler";
import { notificationsTypeServer } from "@typings/User";
import userShortObj from "@utils/userShortObj";
import { ioType } from "custom";

export const friendDecline = async (
  io: ioType,
  userSenderUID: string,
  userReceiverUID: string
) => {
  const userReceiver = await getUserDB("uid", userReceiverUID);

  const userSender = await getUserDB("uid", userSenderUID);

  if (userReceiver && userSender) {
    const newWaitingList = userReceiver.waitingsUID.filter(
      (u) => u !== userSender.uid!
    );
    editUser(userReceiver.uid!, "waitingsUID", newWaitingList);
    const notif = {
      time: new Date().getTime(),
      header: "FRIEND_REQUEST_DECLINE",
      icon: userSender.avatar,
      userUID: userSender.uid,
    } as notificationsTypeServer;
    const users = cache.users.filter((u) => u.userUID === userReceiver.uid);
    if (users.length === 1) {
      const socket = users[0].socketID;
      if (socket) {
        io.to(socket).emit("CLIENT_FRIENDS", {
          header: "FRIEND_DECLINE",
          user: userShortObj(userSender),
        });
      }
    }
    notificationsAddUser(userSender.uid!, notif, io);
  }
};
