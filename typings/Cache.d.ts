import { ChatType, MessagesType } from "@typings/Messenger";
import { UserType } from "@typings/User";

type UsersCacheType = {
  userUID: string;
  socketID: string;
};

export type CacheType = {
  chats: ChatType[];
  messages: MessagesType;
  users: UsersCacheType[];
};
