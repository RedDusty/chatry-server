import { cache } from "@database/cache";
import { fbFirestore } from "@database/firebase";
import { InfoUserType, UserType } from "@typings/User";

export const editUser = async <K extends keyof UserType>(
  userUID: string,
  key: K,
  value: UserType[K]
) => {
  const res = await fbFirestore
    .collection("users")
    .doc(userUID)
    .update({ [key]: value });

  return res.writeTime;
};

export const editInfoUser = async <K extends keyof InfoUserType>(
  userUID: string,
  key: K,
  value: InfoUserType[K]
) => {
  const res = await fbFirestore
    .collection("Info_Users")
    .doc(userUID)
    .update({ [key]: value });

  return res.writeTime;
};
