import { cache } from "@database/cache";
import { ChatTwoType } from "@typings/Messenger";
import { io } from "index";
import { getUserDB } from "@database/handlers/getUserDB";
import { fbFirestore } from "@database/firebase";
import { createRefreshToken, createToken } from "@utils/token";
import { UserTypeServer } from "@typings/User";
import { editInfoUser, editUser } from "@database/handlers/UserHandler";
import { UsersCacheType } from "@typings/Cache";

export default async function userChangeUsername(data: any, socketID: string) {
  const username = data.username as string;
  const uid = data.uid as string;

  const getUserDuplicate = await getUserDB(
    "subname",
    String(username).toLowerCase()
  );
  const doc = await fbFirestore.collection("users").doc(uid).get();
  const userData = doc.data() as UserTypeServer;
  const prevUsername = userData.username;
  userData.username = String(username);
  userData.subname = String(username).toLowerCase();
  const lastUsernameUpdate = new Date().getTime();
  userData.lastUsernameUpdate = lastUsernameUpdate;

  const token = await createToken(userData, uid);
  const refreshToken = await createRefreshToken(userData, uid, false);

  let canChange = true;

  if (
    userData.lastUsernameUpdate <
    new Date().getTime() - 1000 * 60 * 60 * 24 * 7
  ) {
    io.to(socketID).emit("USERNAME_CHANGE", {
      error: true,
      text: "USERNAME_TOO_OFTEN",
    });
    canChange = false;
    return;
  }
  if (getUserDuplicate !== null) {
    io.to(socketID).emit("USERNAME_CHANGE", {
      error: true,
      text: "USERNAME_EXIST",
    });
    canChange = false;
    return;
  }
  if (username.length < 4 || username.length > 16) {
    io.to(socketID).emit("USERNAME_CHANGE", {
      error: true,
      text: "USERNAME_LENGTH",
    });
    canChange = false;
    return;
  }
  if (
    /^[a-zA-Z0-9<>^/|\\[\]{}()`'":;.,!?@№#$%&*-_=+]*$/g.test(username) === false
  ) {
    io.to(socketID).emit("USERNAME_CHANGE", {
      error: true,
      text: "USERNAME_REGEX",
    });
    canChange = false;
    return;
  }

  if (canChange) {
    editUser(uid, "username", username);
    editUser(uid, "subname", String(username).toLowerCase());
    editUser(uid, "lastUsernameUpdate", lastUsernameUpdate);

    editInfoUser(uid, "subname", String(username).toLowerCase());
    editInfoUser(uid, "refreshToken", refreshToken);

    await fbFirestore
      .collection("users")
      .doc(uid)
      .collection("usernames")
      .doc(String(lastUsernameUpdate))
      .set({
        updateTime: lastUsernameUpdate,
        username: prevUsername,
      });

    io.to(socketID).emit("USERNAME_CHANGE", {
      error: false,
      username: String(username),
      subname: String(username).toLowerCase(),
      token: token,
      refreshToken: refreshToken,
      user: userData,
    });

    const chats = cache.chats.filter((c) => c.usersUID.includes(uid));

    const usersToUpdate: UsersCacheType[] = [];
    const usersUIDToUpdate: string[] = [];

    chats.forEach((c) => {
      c.usersUID.forEach((u) => {
        if (usersUIDToUpdate.includes(u) === false) {
          const cachedUsers = cache.users.filter(
            (cu) => cu.userUID === u && cu.socketID !== null
          );

          if (cachedUsers.length === 1) {
            usersToUpdate.push(cachedUsers[0]);
            usersUIDToUpdate.push(cachedUsers[0].userUID);
          }
        }
      });
    });

    usersToUpdate.forEach((u) => {
      if (u.socketID) {
        io.to(u.socketID).emit("USERS_CACHE_UPDATE", {
          uid: userData.uid,
          username: userData.username,
        });
      }
    });
  }

  return;
}
