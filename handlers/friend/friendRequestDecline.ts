import { cache } from "@database/cache";
import { getUserDB } from "@database/handlers/getUserDB";
import { notificationsAddUser } from "@database/handlers/notifications";
import { editUser } from "@database/handlers/UserHandler";
import { UserShortType, notificationsType } from "@typings/User";
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
    const newWaitingList = (userReceiver.waitingsUID).filter(
      (u) => u !== userSender.uid!
    );
    editUser(userReceiver.uid!, "waitingsUID", newWaitingList);
    const notif = {
      time: new Date().getTime(),
      header: "FRIEND_REQUEST_DECLINE",
      data: {
        avatar: userSender.avatar,
        username: userSender.username,
        online: userSender.online,
        uid: userSender.uid,
      } as UserShortType,
      icon: userSender.avatar,
    } as notificationsType;
    const userIndex = cache.users.findIndex(
      (u) => u.userUID === userReceiver.uid
    );
    if (userIndex !== -1) {
      io.to(cache.users[userIndex].socketID).emit("CLIENT_FRIENDS", {
        header: "FRIEND_DECLINE",
        user: userShortObj(userSender),
      });
    }
    notificationsAddUser(
      userSender.uid!,
      notif,
      io,
    );
  }
};
