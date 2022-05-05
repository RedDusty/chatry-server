import { cache } from "@database/cache";
import { fbFirestore } from "@database/firebase";
import { getUserDB } from "@database/handlers/getUserDB";
import { ChatType, MessageType } from "@typings/Messenger";
import { UserType } from "@typings/User";
import { io } from "index";
import chatCreate from "@handlers/messages/chatCreate";
import { isOnlineUser } from "@database/handlers/onlineUsers";

export default async function messagesGet(uid: string, socketID: string) {
  const chatsCached = cache.chats.filter(
    (c) =>
      c.chatType === "two-side" &&
      c.users.findIndex((u) => u.uid === uid) !== -1
  );

  const chatsDocsGet = await fbFirestore
    .collection("chats")
    .where("users", "array-contains", uid)
    .get();

  const chats: ChatType[] = [];

  if (chatsDocsGet.size > 0) {
    const chatsDocs = chatsDocsGet.docs;

    for (let idx = 0; idx < chatsDocs.length; idx++) {
      const chatData = chatsDocs[idx].data() as ChatType;

      if (chatsCached.findIndex((c) => c.cid !== chatData.cid)) {
        cache.chats.push(chatData);
        delete (chatData as any).editedData;
        delete (chatData as any).existsInDB;
        if (chatData.chatType === "two-side") {
          for (let idx = 0; idx < chatData.users.length; idx++) {
            const u = chatData.users[idx];
            const isOnline = await isOnlineUser(u.uid);
            if (typeof isOnline === "number") {
              u.online = isOnline;
            } else if (isOnline === true) {
              u.online = true;
            } else {
              const user = await getUserDB("uid", u.uid);
              u.online = user !== null ? user.online : 0;
            }
          }
        }

        chats.push(chatData);
      }
    }
  } else {
    for (let idx = 0; idx < chatsCached.length; idx++) {
      const c = chatsCached[idx];
      delete (c as any).editedData;
      delete (c as any).existsInDB;
      if (c.chatType === "two-side") {
        for (let kdx = 0; kdx < c.users.length; kdx++) {
          const u = c.users[kdx];
          const isOnline = await isOnlineUser(u.uid);
          if (typeof isOnline === "number") {
            u.online = isOnline;
          } else if (isOnline === true) {
            u.online = true;
          } else {
            const user = await getUserDB("uid", u.uid);
            u.online = user !== null ? user.online : 0;
          }
        }
      }

      chats.push(c);
    }
  }

  const user = (await getUserDB("uid", uid)) as UserType;
  const friendsUIDS = user.friendsUID;

  for (let idx = 0; idx < friendsUIDS.length; idx++) {
    const chatIndex = chats.findIndex(
      (c) =>
        c.chatType === "two-side" &&
        c.users.findIndex((u) => u.uid === friendsUIDS[idx]) !== -1
    );
    if (chatIndex === -1) {
      const friendChat = await chatCreate({
        chatName: "two-side",
        uid: "two-side",
        usersUID: [uid, friendsUIDS[idx]],
      });

      delete (friendChat as any).editedData;
      delete (friendChat as any).existsInDB;
      if (friendChat.chatType === "two-side") {
        for (let idx = 0; idx < friendChat.users.length; idx++) {
          const u = friendChat.users[idx];
          const isOnline = await isOnlineUser(u.uid);
          if (typeof isOnline === "number") {
            u.online = isOnline;
          } else if (isOnline === true) {
            u.online = true;
          } else {
            const user = await getUserDB("uid", u.uid);
            u.online = user !== null ? user.online : 0;
          }
        }
      }

      chats.push(friendChat);
    }
  }

  const messages = [];

  for (let idx = 0; idx < chats.length; idx++) {
    const hasCacheMessages = cache.messages.has(chats[idx].cid);

    if (hasCacheMessages) {
      const cacheMessages = cache.messages.get(chats[idx].cid)!;

      messages.push({ cid: chats[idx].cid, messages: cacheMessages });
    } else {
      const dbMessages = await fbFirestore
        .collection("messages")
        .doc(chats[idx].cid)
        .collection("messages")
        .get();

      const tempMessages: MessageType[] = [];

      dbMessages.forEach((d) => {
        tempMessages.push(d.data() as MessageType);
      });

      tempMessages.sort((a, b) => a.time - b.time);

      messages.push({ cid: chats[idx].cid, messages: tempMessages });
    }
  }

  io.to(socketID).emit("CHATS_INITIAL", {
    chats: chats,
    messages: messages,
  });
  return;
}
