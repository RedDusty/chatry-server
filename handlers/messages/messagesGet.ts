import { cache } from "@database/cache";
import { fbFirestore } from "@database/firebase";
import { getUserDB } from "@database/handlers/getUserDB";
import { ChatType, MessageType } from "@typings/Messenger";
import { UserType } from "@typings/User";
import { io } from "index";
import chatCreate from "@handlers/messages/chatCreate";
import { isOnlineUser } from "@database/handlers/onlineUsers";
import structuredClone from "@utils/structuredClone";

export default async function messagesGet(uid: string, socketID: string) {
  const chatsCached = cache.chats.filter((c) => c.usersUID.includes(uid));

  const chatsMultipleDocsGet = await fbFirestore
    .collection("chats")
    .where("usersUID", "array-contains", uid)
    .where("chatType", "!=", "two-side")
    .get();

  const chatsTwoSideDocsGet = await fbFirestore
    .collection("chats")
    .where("usersUID", "array-contains", uid)
    .where("chatType", "==", "two-side")
    .get();

  const chatsDocsGet = [
    ...chatsTwoSideDocsGet.docs,
    ...chatsMultipleDocsGet.docs,
  ];

  const chats: ChatType[] = [];

  if (chatsDocsGet.length > 0) {
    for (let idx = 0; idx < chatsDocsGet.length; idx++) {
      const chatData = chatsDocsGet[idx].data() as ChatType;

      if (chatsCached.findIndex((c) => c.cid !== chatData.cid)) {
        cache.chats.push(chatData);
        const chat = structuredClone(chatData);
        delete (chat as any).editedData;
        delete (chat as any).existsInDB;

        if (chat.chatType === "two-side") {
          for (let kdx = 0; kdx < chat.users.length; kdx++) {
            const u = chat.users[kdx];
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

        chats.push(chat);
      }
    }
  } else {
    for (let idx = 0; idx < chatsCached.length; idx++) {
      const chat = structuredClone(chatsCached[idx]);
      delete (chat as any).editedData;
      delete (chat as any).existsInDB;

      if (chat.chatType === "two-side") {
        for (let kdx = 0; kdx < chat.users.length; kdx++) {
          const u = chat.users[kdx];
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

      chats.push(chat);
    }
  }

  const user = (await getUserDB("uid", uid)) as UserType;
  const friendsUIDS = user.friendsUID;

  const friendsUIDsChats: string[] = [];

  chats.forEach((c) => {
    if (c.chatType === "two-side") {
      const friendUID = c.usersUID.filter((u) => u !== uid)[0];
      c.usersUID.includes(friendUID) && friendsUIDsChats.push(friendUID);
    }
  });

  for (let idx = 0; idx < friendsUIDS.length; idx++) {
    if (friendsUIDsChats.includes(friendsUIDS[idx]) === false) {
      const friendChat = await chatCreate({
        chatName: "two-side",
        uid: "two-side",
        usersUID: [uid, friendsUIDS[idx]],
      });
      const chat = structuredClone(friendChat);
      delete (chat as any).editedData;
      delete (chat as any).existsInDB;
      if (chat.chatType === "two-side") {
        for (let idx = 0; idx < chat.users.length; idx++) {
          const u = chat.users[idx];
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

      chats.push(chat);
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
        .collection("chats")
        .doc(chats[idx].cid)
        .collection("messages")
        .orderBy("mid", "desc")
        .limit(25)
        .get();

      const tempMessages: MessageType[] = [];

      dbMessages.forEach((d) => {
        tempMessages.push(d.data() as MessageType);
      });

      tempMessages.sort((a, b) => a.time - b.time);

      cache.messages.set(chats[idx].cid, tempMessages)

      messages.push({ cid: chats[idx].cid, messages: tempMessages });
    }
  }

  io.to(socketID).emit("CHATS_INITIAL", {
    chats: chats,
    messages: messages,
  });
  return;
}
