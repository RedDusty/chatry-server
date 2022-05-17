import { cache } from "@database/cache";
import { fbFirestore } from "@database/firebase";
import { UserShortType, UserTypeServer } from "@typings/User";

export default async function searchUserDB<K extends keyof UserTypeServer>(
  key: K,
  value: UserTypeServer[K] | string,
  userUID: string
) {
  if (key === "subname") {
    value = String(value).toLowerCase();
  }
  const userDocs = await fbFirestore
    .collection("users")
    .where(key, ">=", value)
    .where(key, "<=", value + "\uf8ff")
    .limit(15)
    .get();

  const users: UserShortType[] = [];

  userDocs.docs.forEach((user) => {
    const docData = user.data() as UserShortType;
    if (docData.uid === userUID) return;

    const isOnline = cache.users.findIndex((u) => u.userUID === docData.uid);

    users.push({
      avatar: docData.avatar,
      username: docData.username,
      online: isOnline !== -1 ? true : docData.online,
      uid: docData.uid,
      privacy: docData.privacy,
    } as UserShortType);
  });

  return users;
}
