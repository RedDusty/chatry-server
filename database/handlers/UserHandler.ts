import { cache } from "@database/cache";
import { fbFirestore } from "@database/firebase";
import { InfoUserType, UserTypeServer } from "@typings/User";
import { io } from "index";

export const editUser = async <K extends keyof UserTypeServer>(
  userUID: string,
  key: K,
  value: UserTypeServer[K]
) => {
  const users = cache.users.filter((u) => u.userUID === userUID);

  if (users.length === 1) {
    users[0].info[key] = value;
    users[0].info.editedData = true;

    const socket = users[0].socketID;

    if (socket) {
      io.to(socket).emit("USER_EDIT", {
        key: key,
        value: value,
      });
    }
  } else {
    const res = await fbFirestore
      .collection("users")
      .doc(userUID)
      .update({ [key]: value });

    return res.writeTime;
  }
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
