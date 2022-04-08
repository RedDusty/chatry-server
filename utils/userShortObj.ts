import { UserShortType, UserType } from "@typings/User";

export default function userShortObj(
  user: UserType | UserShortType | null,
  uid?: string
) {
  if (user) {
    return {
      avatar: user.avatar,
      username: user.username,
      online: user.online,
      uid: user.uid,
    } as UserShortType;
  } else {
    return {
      avatar: null,
      username: "DELETED",
      online: 0,
      uid: uid,
    } as UserShortType;
  }
}
