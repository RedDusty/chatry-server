import { cache } from "@database/cache";
import { editUser } from "@database/handlers/UserHandler";
import { UserTypeServer } from "@typings/User";
import { ioType } from "custom";

export const friendAddUser = async (
  io: ioType,
  firstUser: UserTypeServer,
  secondUser: UserTypeServer
) => {
  if (firstUser && secondUser) {
    const newFriendsUID = firstUser.friendsUID;
    newFriendsUID.push(secondUser.uid!);
    editUser(firstUser.uid, "friendsUID", newFriendsUID);
    const users = cache.users.filter((u) => u.userUID === firstUser.uid);
    if (users.length === 1) {
      const socket = users[0].socketID;

      if (socket) {
        io.to(socket).emit("CLIENT_FRIENDS", {
          header: "FRIEND_ADD",
          user: secondUser.uid,
        });
      }
    }
  }
};
