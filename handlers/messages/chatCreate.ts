import { cache } from "@database/cache";
import { getUserDB } from "@database/handlers/getUserDB";
import { ChatMultipleType, ChatTwoType, ChatType } from "@typings/Messenger";
import userShortObj from "@utils/userShortObj";
import * as crypto from "crypto";
import { io } from "index";

type chatCreateDataType = {
  usersUID: string[];
  uid: string;
  chatName: string;
};

export default async function chatCreate(data: chatCreateDataType) {
  const { usersUID, uid, chatName } = data;

  const cid = crypto.randomUUID();

  const chatInfo = {
    cid: cid,
    editedData: true,
    existsInDB: false,
    messagesCount: 0,
  };

  if (usersUID.length > 2) {
    Object.assign(chatInfo, {
      avatar: null,
      chatType: "private",
      name: chatName,
      ownerUID: uid,
      usersUID: usersUID,
    } as ChatMultipleType);
  } else if (usersUID.length === 2) {
    const users = [];
    for (let idx = 0; idx < usersUID.length; idx++) {
      const user = await getUserDB("uid", usersUID[idx]);

      if (user) {
        users.push(userShortObj(user));
      }
    }
    Object.assign(chatInfo, {
      chatType: "two-side",
      users: users,
      usersUID: usersUID,
    } as ChatTwoType);
  }

  cache.chats.push(chatInfo as ChatType);

  cache.messages.set(cid, []);

  usersUID.forEach((cu: string) => {
    const userIndex = cache.users.findIndex((u) => u.userUID === cu);

    if (userIndex !== -1) {
      delete (chatInfo as any).editedData;
      delete (chatInfo as any).existsInDB;
      io.to(cache.users[userIndex].socketID).emit("CHAT_CLIENT_CREATE", {
        chatInfo: chatInfo,
        messages: [],
      });
    }
  });

  chatInfo["editedData"] = true;
  chatInfo["existsInDB"] = false;

  return chatInfo as ChatType;
}
