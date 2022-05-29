import { cache } from "@database/cache";
import { ChatTwoType, MessageType } from "@typings/Messenger";
import { io } from "index";
import structuredClone from "@utils/structuredClone";
import { getUserDB } from "@database/handlers/getUserDB";
import chatCreate from "@handlers/messages/chatCreate";

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
  const reqUID = data.reqUID as string | undefined;

  message.time = new Date().getTime();
  message.existsInDB = false;
  if (message.images) {
    message.images = message.images.slice(0, 5);
  }

  const chat = cache.chats.find((c) => c.cid === message.cid);

  if (chat) {
    let canUserMessage = false;

    if (
      chat.chatType !== "two-side" &&
      chat.usersUID.filter((u) => u === uid).length === 1
    ) {
      canUserMessage = true;
    }

    if (chat.chatType === "two-side") {
      const userUIDSecond = chat.usersUID.filter((u) => u !== uid)[0];

      const userSecond = await getUserDB("uid", userUIDSecond);

      if (userSecond) {
        if (userSecond.privacy.twoside === "friends") {
          if (userSecond.friendsUID.includes(uid)) canUserMessage = true;
        } else canUserMessage = true;
      }
    }

    if (canUserMessage === false) {
      returnMessageError();
      return;
    }

    const cachedMessages = cache.messages.get(message.cid);
    message.mid = chat.messagesCount + 1;

    if (cachedMessages) {
      cachedMessages.push(message);
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
  } else {
    if (reqUID) {
      const user = await getUserDB("uid", uid);
      const userReq = await getUserDB("uid", reqUID);

      if (user && userReq) {
        let canUserMessage = false;

        if (userReq.privacy.twoside === "friends") {
          if (userReq.friendsUID.includes(uid)) {
            canUserMessage = true;
          }
        } else canUserMessage = true;

        if (canUserMessage) {
          const createdChat = (await chatCreate(
            {
              chatName: "",
              uid: "",
              usersUID: [uid, userReq.uid],
            },
            true
          )) as ChatTwoType;

          message.mid = createdChat.messagesCount + 1;
          message.cid = createdChat.cid;
          const cachedMessages = cache.messages.get(createdChat.cid);
          if (cachedMessages) {
            cachedMessages.push(message);
          }
          createdChat.editedData = true;
          createdChat.messagesCount++;

          const messageReady = structuredClone(message);

          delete (messageReady as any).existsInDB;
          delete (messageReady as any).editedData;

          io.to(socketID).emit("CHAT_TWO_SIDE_ACCEPT", {
            chat: createdChat,
            messages: [messageReady],
            reqUID,
          });

          if (userReq.socketID) {
            io.to(userReq.socketID).emit("CHAT_CLIENT_CREATE", {
              chat: createdChat,
              messages: [messageReady],
            });
          }
          return;
        } else {
          returnMessageError();
          return;
        }
      }
    }
  }

  returnMessageError();
  return;
}
