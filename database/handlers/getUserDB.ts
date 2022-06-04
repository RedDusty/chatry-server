import { cache } from "@database/cache";
import { firestore } from "firebase-admin";
import { InfoUserType, UserTypeServer } from "@typings/User";

export async function getUserDB<K extends keyof UserTypeServer>(
  key: K,
  value: UserTypeServer[K]
) {
  if (key === "subname") {
    value = String(value).toLowerCase() as any;
  }

  const users = cache.users.filter((u) => u.info[key] === value);

  if (users.length > 0) {
    return users[0].info;
  } else {
    const userDocs = await firestore()
      .collection("users")
      .where(key, "==", value)
      .limit(1)
      .get();

    if (userDocs.size === 0) return null;

    const userDoc = userDocs.docs[0];

    if (userDoc.exists === false) return null;

    const userInfo = userDoc.data() as UserTypeServer;

    if (cache.users.filter((u) => u.userUID === userInfo.uid).length === 0) {
      cache.users.push({
        info: userInfo,
        socketID: null,
        userUID: userInfo.uid,
      });
    }

    return userInfo as UserTypeServer;
  }
}

export async function getInfoUserDB<K extends keyof InfoUserType>(
  key: K,
  value: InfoUserType[K]
) {
  if (key === "subname") {
    value = String(value).toLowerCase() as any;
  }
  const userDocs = await firestore()
    .collection("Info_Users")
    .where(key, "==", value)
    .limit(1)
    .get();

  if (userDocs.size === 0) return null;

  const userDoc = userDocs.docs[0];

  if (userDoc.exists === false) return null;

  const userInfo = userDoc.data();

  return userInfo as InfoUserType;
}
