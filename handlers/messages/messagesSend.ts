import { cache } from "@database/cache";
import { MessageType } from "@typings/Messenger";
import { io } from "index";
import * as crypto from "crypto";

export default async function messagesSend(data: any, socketID: string) {
  const message = data as MessageType;

  message.time = new Date().getTime();
  message.mid = crypto.randomUUID();
  message.existsInDB = false;

  const chat = cache.chats.find((c) => c.cid === message.cid);

  const cachedMessages = cache.messages.get(message.cid);

  if (cachedMessages) {
    cachedMessages.push(message);
  }

  if (chat) {
    chat.editedData = true;
    chat.messagesCount++;

    if (chat.chatType !== "two-side") {
      chat.usersUID.forEach((cu) => {
        const userIndex = cache.users.findIndex((u) => u.userUID === cu);

        if (userIndex !== -1) {
          delete (message as any).existsInDB;
          delete (message as any).editedData;
          io.to(cache.users[userIndex].socketID).emit("MESSAGE_SEND", {
            messagesCount: chat.messagesCount,
            message: message,
          });
        }
      });
    } else {
      chat.users.forEach((cu) => {
        const userIndex = cache.users.findIndex((u) => u.userUID === cu.uid);

        if (userIndex !== -1) {
          delete (message as any).existsInDB;
          delete (message as any).editedData;
          io.to(cache.users[userIndex].socketID).emit("MESSAGE_SEND", {
            messagesCount: chat.messagesCount,
            message: message,
          });
        }
      });
    }
  }
}
