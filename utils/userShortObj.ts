import { cache } from "@database/cache";
import { UserShortType, UserType } from "@typings/User";

export default function userShortObj(
  user: UserType | UserShortType | null,
  uid?: string
) {
  if (user) {
    const rUser = {
      avatar: user.avatar,
      username: user.username,
      online: user.online,
      uid: user.uid,
      privacy: user.privacy,
    } as UserShortType;

    const isOnline = cache.users.findIndex((u) => u.userUID === user.uid);

    rUser.online = isOnline !== -1 ? true : rUser.online;

    return rUser;
  } else {
    return {
      avatar: null,
      username: "DELETED",
      online: 0,
      uid: uid,
      privacy: {
        messages: "all",
        profile: "public",
      },
    } as UserShortType;
  }
}
