import { notificationsAddUser } from "@database/handlers/notifications";
import { editUser } from "@database/handlers/UserHandler";
import { notificationsTypeServer, UserTypeServer } from "@typings/User";
import { ioType } from "custom";
import { friendAddUser } from "@handlers/friend/friendAddUser";

export const friendAccept = async (
  io: ioType,
  userSender: UserTypeServer,
  userReceiver: UserTypeServer
) => {
  const newWaitingList = userSender.waitingsUID.filter(
    (u) => u !== userReceiver.uid
  );
  editUser(userSender.uid, "waitingsUID", newWaitingList);
  const notif = {
    time: new Date().getTime(),
    header: "FRIEND_REQUEST_ACCEPT",
    icon: userSender.avatar,
    userUID: userSender.uid,
  } as notificationsTypeServer;
  notificationsAddUser(userReceiver.uid, notif, io);
  friendAddUser(io, userSender, userReceiver);
  friendAddUser(io, userReceiver, userSender);
};
