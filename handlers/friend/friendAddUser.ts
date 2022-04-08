import { cache } from '@database/cache';
import { editUser } from '@database/handlers/UserHandler';
import { UserType } from '@typings/User';
import { ioType } from 'custom';

export const friendAddUser = async (
    io: ioType,
    firstUser: UserType,
    secondUser: UserType
  ) => {
    if (firstUser && secondUser) {
      const newFriendsUID = firstUser.friendsUID;
      newFriendsUID.push(secondUser.uid!);
      editUser(firstUser.uid!, "friendsUID", newFriendsUID);
      const userIndex = cache.users.findIndex((u) => u.userUID === firstUser.uid);
      if (userIndex !== -1) {
        io.to(cache.users[userIndex].socketID).emit("FRIEND_REQUEST_CLIENT", {
          header: "ADD",
          user: secondUser.uid,
        });
      }
    }
  };