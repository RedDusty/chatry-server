import { cache } from "@database/cache";
import { fbFirestore } from "@database/firebase";
import { UserShortType, UserTypeServer } from "@typings/User";
import { isOnlineUser } from "./onlineUsers";

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

  for (let idx = 0; idx < userDocs.size; idx++) {
    const user = userDocs.docs[idx];
    const docData = user.data() as UserShortType;
    if (docData.uid === userUID) continue;

    const isOnline = await isOnlineUser(docData.uid);

    users.push({
      avatar: docData.avatar,
      username: docData.username,
      online: isOnline,
      uid: docData.uid,
      privacy: docData.privacy,
    } as UserShortType);
  }

  return users;
}
