import { cache } from "@database/cache";
import { ChatTwoType } from "@typings/Messenger";
import { io } from "index";
import { getUserDB } from "@database/handlers/getUserDB";
import { fbFirestore } from "@database/firebase";
import { createRefreshToken, createToken } from "@utils/token";
import { UserType } from "@typings/User";

export default async function userChangeUsername(data: any, socketID: string) {
  const username = data.username as string;
  const uid = data.uid as string;

  const getUserDuplicate = await getUserDB(
    "subname",
    String(username).toLowerCase()
  );
  const doc = await fbFirestore.collection("users").doc(uid).get();
  const userData = doc.data() as UserType;
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
    await fbFirestore
      .collection("users")
      .doc(uid)
      .update({
        username: String(username),
        subname: String(username).toLowerCase(),
        lastUsernameUpdate: lastUsernameUpdate,
      } as UserType)
      .then(() => {
        io.to(socketID).emit("USERNAME_CHANGE", {
          error: false,
          username: String(username),
          subname: String(username).toLowerCase(),
          token: token,
          refreshToken: refreshToken,
          user: userData,
        });
      });
    await fbFirestore
      .collection("Info_Users")
      .doc(uid)
      .update({
        subname: String(username).toLowerCase(),
        refreshToken,
      });

    await fbFirestore
      .collection("users")
      .doc(uid)
      .collection("usernames")
      .doc(String(lastUsernameUpdate))
      .set({
        updateTime: lastUsernameUpdate,
        username: prevUsername,
      });

    const getChats = await fbFirestore
      .collection("chats")
      .where("usersUID", "array-contains", uid)
      .where("chatType", "==", "two-side")
      .get();

    cache.chats.forEach((c) => {
      if (c.chatType === "two-side") {
        const chatUser = c.users.filter((u) => u.uid === uid)[0];
        chatUser.username = String(username);
        chatUser.subname = String(username).toLowerCase();
      }
    });

    cache.messages.forEach((c) => {
      c.forEach((m) => {
        if (m.user !== "system") {
          m.user.username = String(username);
          m.user.subname = String(username).toLowerCase();
        }
      });
    });

    getChats.forEach(async (doc) => {
      const chat = doc.data() as ChatTwoType;

      const users = chat.users;

      users.forEach((u) => {
        if (u.uid === uid) {
          u.username = String(username);
          u.subname = String(username).toLowerCase();
        }
      });

      await fbFirestore.collection("chats").doc(chat.cid).update({
        users: users,
      });
    });
  }

  return;
}
