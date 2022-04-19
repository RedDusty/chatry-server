import { cache } from "@database/cache";
import { editUser } from "@database/handlers/UserHandler";

export const addOnlineUser = async (userUID: string, socketID: string) => {
  cache.users.push({ userUID, socketID });
};

export const removeOnlineUser = async (socketID: string) => {
  const indexUser = cache.users.findIndex((user) => user.socketID === socketID);

  if (indexUser !== -1) {
    const userData = cache.users[indexUser];

    editUser(userData.userUID, "online", new Date().getTime());

    cache.users.splice(indexUser, 1);
  }
};
