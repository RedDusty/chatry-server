import { CacheType } from "@typings/Cache";
import {
  editUser,
  getUser,
  notificationsAddUser,
  notificationsGetUser,
  searchUser,
} from "@database/handlers/UserHandler";
import {
  addUserChat,
  createChat,
  getChat,
  sendMessage,
} from "@database/handlers/MessengerHandler";

export const cache: CacheType = {
  chats: [],
  messages: new Map(),
  users: [],
};

export const getDatabase = () => {
  return {
    getUser: getUser,
    editUser: editUser,
    searchUser: searchUser,
    notificationsGetUser: notificationsGetUser,
    notificationsAddUser: notificationsAddUser,
    sendMessage: sendMessage,
    createChat: createChat,
    getChat: getChat,
    addUserChat: addUserChat,
  };
};
