import { cache } from "@database/cache";
import { UserShortType, UserTypeServer } from "@typings/User";

export default function userShortObj(
  user: UserTypeServer | UserShortType | null,
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

    const isOnline = cache.users.filter((u) => u.userUID === user.uid);

    if (isOnline.length === 1) {
      rUser.online = isOnline[0].info.online;
    } else {
      rUser.online = false;
    }

    return rUser;
  } else {
    return {
      avatar: null,
      username: "DELETED",
      online: 0,
      uid: uid,
      privacy: {
        twoside: "all",
        profile: "public",
      },
    } as UserShortType;
  }
}
