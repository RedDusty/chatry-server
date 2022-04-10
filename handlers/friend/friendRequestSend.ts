import { cache } from "@database/cache";
import { getUserDB } from "@database/handlers/getUserDB";
import { editUser, notificationsAddUser } from "@database/handlers/UserHandler";
import { UserShortType, notificationsType } from "@typings/User";
import userShortObj from "@utils/userShortObj";
import { ioType } from "custom";

export const friendRequestSend = async (
  io: ioType,
  userSenderUID: string,
  userReceiverUID: string
) => {
  const userSender = await getUserDB("uid", userSenderUID);

  const userReceiver = await getUserDB("uid", userReceiverUID);

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
      header: "FRIEND_REQUEST_SEND",
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
