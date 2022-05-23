import { cache } from "@database/cache";
import { MessageType } from "@typings/Messenger";
import { io } from "index";
import structuredClone from "@utils/structuredClone";

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
  if (message.images) {
    message.images = message.images.slice(0, 5);
  }

  const chat = cache.chats.find((c) => c.cid === message.cid);

  const cachedMessages = cache.messages.get(message.cid);

  if (chat) {
    let canUserMessage = false;
    message.mid = chat.messagesCount + 1;

    if (cachedMessages) {
      cachedMessages.push(message);
    }

    if (chat.usersUID.filter((u) => u === uid).length === 1) {
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
        const users = cache.users.filter((u) => u.userUID === cu);

        if (users.length === 1) {
          const socket = users[0].socketID;

          if (socket) {
            delete (messageReady as any).existsInDB;
            delete (messageReady as any).editedData;
            io.to(socket).emit("MESSAGE_ACCEPT", {
              messagesCount: chat.messagesCount,
              message: messageReady,
              cid: chat.cid,
            });
          }
        }
      });
      return;
    } else {
      chat.usersUID.forEach((cu) => {
        const users = cache.users.filter((u) => u.userUID === cu);

        if (users.length === 1) {
          const socket = users[0].socketID;

          if (socket) {
            delete (messageReady as any).existsInDB;
            delete (messageReady as any).editedData;
            io.to(socket).emit("MESSAGE_ACCEPT", {
              messagesCount: chat.messagesCount,
              message: messageReady,
              cid: chat.cid,
            });
          }
        }
      });
      return;
    }
  }

  returnMessageError();
  return;
}
