import { notificationsAddUser } from "@database/handlers/notifications";
import { editUser } from "@database/handlers/UserHandler";
import { notificationsType, UserType } from "@typings/User";
import userShortObj from "@utils/userShortObj";
import { ioType } from "custom";
import { friendAddUser } from "./friendAddUser";

export const friendAccept = async (
  io: ioType,
  userSender: UserType,
  userReceiver: UserType
) => {
  const newWaitingList = userSender.waitingsUID.filter(
    (u) => u !== userReceiver.uid
  );
  editUser(userSender.uid, "waitingsUID", newWaitingList);
  const notif = {
    time: new Date().getTime(),
    header: "FRIEND_REQUEST_ACCEPT",
    data: userShortObj(userSender, userSender.uid),
    icon: userSender.avatar,
  } as notificationsType;
  notificationsAddUser(userReceiver.uid, notif, io);
  friendAddUser(io, userSender, userReceiver);
  friendAddUser(io, userReceiver, userSender);
};
