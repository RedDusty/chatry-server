import { cache } from "@database/cache";
import { getUserDB } from "@database/handlers/getUserDB";

export const addOnlineUser = async (userUID: string, socketID: string) => {
  const user = await getUserDB("uid", userUID);

  const users = cache.users.filter((user) => user.userUID === userUID);
  if (users.length === 1) {
    users[0].socketID = socketID;
    users[0].info.online = true;
  } else {
    cache.users.push({ userUID, socketID, info: { ...user!, online: true } });
  }
};

export const removeOnlineUser = async (socketID?: string, uid?: string) => {
  if (socketID) {
    const indexUser = cache.users.findIndex(
      (user) => user.socketID === socketID
    );

    if (indexUser !== -1) {
      const userData = cache.users[indexUser];

      userData.info.online = new Date().getTime();
      userData.socketID = null;
    }
  } else if (uid) {
    const indexUser = cache.users.findIndex(
      (user) => user.userUID === uid
    );

    if (indexUser !== -1) {
      const userData = cache.users[indexUser];

      userData.info.online = new Date().getTime();
      userData.socketID = null;
    }
  }
};

export const isOnlineUser = async (userUID: string) => {
  const isOnline = cache.users.filter((u) => u.userUID === userUID);

  if (isOnline.length === 1) {
    return isOnline[0].info.online;
  } else {
    const user = await getUserDB("uid", userUID);
    return user ? 0 : user!.online;
  }
};
