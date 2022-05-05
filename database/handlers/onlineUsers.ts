import { cache } from "@database/cache";
import { editUser } from "@database/handlers/UserHandler";
import { getUserDB } from '@database/handlers/getUserDB';

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

export const isOnlineUser = async (userUID: string) => {
  const isOnline = cache.users.filter((u) => u.userUID === userUID);

  if (isOnline.length === 1) {
    return true;
  } else {
    const user = await getUserDB('uid', userUID);
    return user ? false : user!.online;
  }
};
