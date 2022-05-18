import { cache } from "@database/cache";
import { fbFirestore } from "@database/firebase";
import { getUserDB } from "@database/handlers/getUserDB";
import { ChatType, MessageType } from "@typings/Messenger";
import { UserShortType, UserTypeServer } from "@typings/User";
import { io } from "index";
import chatCreate from "@handlers/messages/chatCreate";
import { isOnlineUser } from "@database/handlers/onlineUsers";
import structuredClone from "@utils/structuredClone";
import userShortObj from "@utils/userShortObj";

type chatMessagesType = {
  cid: string;
  messages: MessageType[];
};

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
  const usersC: UserShortType[] = [];

  for (let idx = 0; idx < chatsCached.length; idx++) {
    const chat = structuredClone(chatsCached[idx]);
    delete (chat as any).editedData;
    delete (chat as any).existsInDB;

    for (let kdx = 0; kdx < chat.usersUID.length; kdx++) {
      const uidC = chat.usersUID[kdx];

      if (usersC.filter((u) => u.uid === uidC).length === 0) {
        const user = await getUserDB("uid", uidC);

        if (user) {
          user.online = await isOnlineUser(user.uid);

          usersC.push(userShortObj(user));
        }
      }
    }

    chats.push(chat);
  }

  if (chatsDocsGet.length > 0) {
    for (let idx = 0; idx < chatsDocsGet.length; idx++) {
      const chatData = chatsDocsGet[idx].data() as ChatType;

      if (chatsCached.findIndex((c) => c.cid === chatData.cid) === -1) {
        cache.chats.push(chatData);
        const chat = structuredClone(chatData);
        delete (chat as any).editedData;
        delete (chat as any).existsInDB;

        for (let kdx = 0; kdx < chat.usersUID.length; kdx++) {
          const uidC = chat.usersUID[kdx];

          if (usersC.filter((u) => u.uid === uidC).length === 0) {
            const user = await getUserDB("uid", uidC);

            if (user) {
              user.online = await isOnlineUser(user.uid);

              usersC.push(userShortObj(user));
            }
          }
        }

        chats.push(chat);
      }
    }
  }

  const user = (await getUserDB("uid", uid)) as UserTypeServer;
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

      for (let kdx = 0; kdx < chat.usersUID.length; kdx++) {
        const uidC = chat.usersUID[kdx];

        if (usersC.filter((u) => u.uid === uidC).length === 0) {
          const user = await getUserDB("uid", uidC);

          if (user) {
            user.online = await isOnlineUser(user.uid);

            usersC.push(userShortObj(user));
          }
        }
      }

      chats.push(chat);
    }
  }

  const messages: chatMessagesType[] = [];

  for (let idx = 0; idx < chats.length; idx++) {
    const hasCacheMessages = cache.messages.has(chats[idx].cid);

    if (hasCacheMessages) {
      const cacheMessages = cache.messages.get(chats[idx].cid)!;

      for (let kdx = 0; kdx < cacheMessages.length; kdx++) {
        const uidC = cacheMessages[kdx].user;

        if (usersC.filter((u) => u.uid === uidC).length === 0) {
          const user = await getUserDB("uid", uidC);

          if (user) {
            user.online = await isOnlineUser(user.uid);

            usersC.push(userShortObj(user));
          }
        }
      }

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

      cache.messages.set(chats[idx].cid, tempMessages);

      for (let kdx = 0; kdx < tempMessages.length; kdx++) {
        const uidC = tempMessages[kdx].user;

        if (usersC.filter((u) => u.uid === uidC).length === 0) {
          const user = await getUserDB("uid", uidC);

          if (user) {
            user.online = await isOnlineUser(user.uid);

            usersC.push(userShortObj(user));
          }
        }
      }

      messages.push({ cid: chats[idx].cid, messages: tempMessages });
    }
  }

  io.to(socketID).emit("CHATS_INITIAL", {
    chats: chats,
    messages: messages,
    usersC: usersC,
  });
  return;
}
