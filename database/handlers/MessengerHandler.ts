import { cache } from "@database/cache";
import { fbFirestore } from "@database/firebase";
import { ChatType, MessageType } from "@typings/Messenger";
import checkFiles from "@utils/checkFiles";
import { notificationsAddUser } from "@database/handlers/notifications";
import { getUserDB } from "@database/handlers/getUserDB";
import userShortObj from "@utils/userShortObj";

export const createChat = (usersUID: string[]) => {
  const chatDoc = fbFirestore.collection("chats").doc();
  const docInfo = {
    existsInDB: true,
    usersUID: usersUID,
    messagesCount: 0,
    id: chatDoc.id,
  } as ChatType;
  chatDoc.set(docInfo);
  return docInfo;
};

export const getChat = async (chatID: string) => {
  let chat = cache.chats.find((c) => c.id === chatID);

  if (chat) {
    return chat;
  } else {
    const chatDoc = await fbFirestore.collection("chats").doc(chatID).get();

    if (chatDoc.exists) {
      chat = chatDoc.data() as ChatType;
      return chat;
    }
  }

  const cachedChat = cache.chats.find((c) => c.id === chatID);

  if (cachedChat) return cachedChat;

  const chatDoc = await fbFirestore.collection("chats").doc(chatID).get();

  if (chatDoc.exists !== true) return null;

  chat = chatDoc.data() as ChatType;

  addChat(chat);

  return chat;
};

export const searchChat = async (nameOrID: string) => {
  let key = "name";
  if (nameOrID.startsWith("#")) {
    key = "id";
  }
  nameOrID = nameOrID.substring(1);
  const userDocs = await fbFirestore
    .collection("chats")
    .where("chatType", "==", "public")
    .where(key, ">=", nameOrID)
    .where(key, "<=", nameOrID + "\uf8ff")
    .limit(15)
    .get();

  const chats: ChatType[] = userDocs.docs.map((c) => {
    return c.data() as ChatType;
  });

  return chats;
};

export const addChat = async (chat: ChatType) => {
  cache.chats.push(chat);

  if (chat.existsInDB === false) {
    chat.existsInDB = true;
    fbFirestore.collection("chats").add(chat);
  }
};

export const addUserChat = async (chatID: string, userUID: string) => {
  const chat = await getChat(chatID);
  const user = await getUserDB("uid", userUID);

  if (chat && user) {
    if (chat.chatType === "public") {
      chat.usersUID.push(user.uid!);

      sendMessage({
        chatID: chat.id,
        existsInDB: false,
        message: `${user.uid} joined`,
        time: 0,
        user: "system",
      });

      return { user, chat };
    }
  }

  return null;
};

export const inviteUserChat = async (
  chatID: string,
  userSendUID: string,
  userGetUID: string
) => {
  const userGet = await getUserDB("uid", userGetUID);

  const userSend = await getUserDB("uid", userSendUID);

  const chat = await getChat(chatID);

  if (chat && userSend && userGet) {
    const isUserInChat = chat.usersUID.includes(userSend.uid!);

    if (isUserInChat) {
      const isUserInFriend = userGet.friendsUID.includes(userSend.uid!);

      if (isUserInFriend) {
        if (chat.chatType !== "two-side") {
          chat.usersUID.push(userGet.uid!);

          sendMessage({
            chatID: chat.id,
            existsInDB: false,
            message: `${userSend.uid} invited ${userGet.uid}`,
            time: 0,
            user: "system",
          });

          notificationsAddUser(userGet.uid!, {
            time: new Date().getTime(),
            header: "CHAT_INVITE",
            data: {
              user: userShortObj(userSend),
              chat: chat,
            },
            icon: userSend.avatar,
          });

          return { userGet, userSend, chat };
        }
      }
    }
  }

  return null;
};

export const checkChatMessages = (chatID: string) => {
  if (cache.messages.has(chatID) !== false) {
    cache.messages.set(chatID, []);
    return chatID;
  } else return chatID;
};

export const getChatMessages = async (chatID: string) => {
  if (cache.messages.has(chatID) === false) {
    const chat = await getChat(chatID);

    if (chat) {
      return checkChatMessages(chatID);
    }
  } else {
    return checkChatMessages(chatID);
  }

  return null;
};

export const sendMessage = async (message: MessageType) => {
  const chatID = await getChatMessages(message.chatID);

  if (chatID) {
    const chat = await getChat(chatID);

    if (chat) {
      const isUserInChat = chat.usersUID.includes(
        typeof message.user !== "string" ? message.user.uid || "" : ""
      );
      if (isUserInChat || message.user === "system") {
        if (checkFiles(message.files)) {
          message.time = new Date().getTime();
          cache.messages.get(chatID)?.push(message);
          chat.editedData = true;

          return message;
        } else {
          return "LARGE_FILES";
        }
      }
    }
  }

  return "UNDEFINED ERROR";
};
