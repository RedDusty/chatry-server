import { fbFirestore } from "@database/firebase";
import { InfoUserType, UserType } from "@typings/User";

export async function getUserDB<K extends keyof UserType>(
  key: K,
  value: UserType[K]
) {
  const userDocs = await fbFirestore
    .collection("users")
    .where(key, "==", value)
    .limit(1)
    .get();

  if (userDocs.size === 0) return null;

  const userDoc = userDocs.docs[0];

  if (userDoc.exists === false) return null;

  const userInfo = userDoc.data();

  return userInfo as UserType;
}

export async function getInfoUserDB<K extends keyof InfoUserType>(
  key: K,
  value: InfoUserType[K]
) {
  const userDocs = await fbFirestore
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
