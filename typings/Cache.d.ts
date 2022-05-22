import { ChatType, MessagesType } from "@typings/Messenger";
import { UserTypeServer } from "@typings/User";

type UsersCacheType = {
  userUID: string;
  socketID: string | null;
  info: UserTypeServer;
};

type imageType = {
  url: string;
  hash: string;
};

export type CacheType = {
  chats: ChatType[];
  messages: MessagesType;
  users: UsersCacheType[];
  images: imageType[];
};
