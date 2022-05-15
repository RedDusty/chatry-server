import { cache } from "@database/cache";
import { MessageType } from "@typings/Messenger";
import { io } from "index";
import * as crypto from "crypto";
import structuredClone from "@utils/structuredClone";
import userShortObj from "@utils/userShortObj";

export default async function messagesSend(data: any, socketID: string) {
  const returnMessageError = () => {
    io.to(socketID).emit("MESSAGE_ACCEPT", {
      messagesCount: -1,
      message: message,
      cid: cid,
      error: true,
    });
  };

  const message = data.message as MessageType;
  const cid = data.cid as string;
  const uid = data.uid as string;

  message.time = new Date().getTime();
  message.existsInDB = false;
  if (message.user !== "system") {
    message.user = userShortObj(message.user);
  }

  const chat = cache.chats.find((c) => c.cid === message.cid);

  const cachedMessages = cache.messages.get(message.cid);

  if (chat) {
    let canUserMessage = false;
    message.mid = chat.messagesCount + 1;

    if (cachedMessages) {
      cachedMessages.push(message);
    }

    if (
      chat.chatType === "two-side" &&
      chat.users.filter((u) => u.uid === uid).length === 1
    ) {
      canUserMessage = true;
    } else if (
      chat.chatType !== "two-side" &&
      chat.usersUID.filter((u) => u === uid).length === 1
    ) {
      canUserMessage = true;
    }

    if (canUserMessage === false) {
      returnMessageError();
      return;
    }

    chat.editedData = true;
    chat.messagesCount++;

    const messageReady = structuredClone(message);

    if (chat.chatType !== "two-side") {
      chat.usersUID.forEach((cu) => {
        const userIndex = cache.users.findIndex((u) => u.userUID === cu);

        if (userIndex !== -1) {
          delete (messageReady as any).existsInDB;
          delete (messageReady as any).editedData;
          io.to(cache.users[userIndex].socketID).emit("MESSAGE_ACCEPT", {
            messagesCount: chat.messagesCount,
            message: messageReady,
            cid: chat.cid,
          });
        }
      });
      return;
    } else {
      chat.users.forEach((cu) => {
        const userIndex = cache.users.findIndex((u) => u.userUID === cu.uid);

        if (userIndex !== -1) {
          delete (messageReady as any).existsInDB;
          delete (messageReady as any).editedData;
          io.to(cache.users[userIndex].socketID).emit("MESSAGE_ACCEPT", {
            messagesCount: chat.messagesCount,
            message: messageReady,
            cid: chat.cid,
          });
        }
      });
      return;
    }
  }

  returnMessageError();
  return;
}
