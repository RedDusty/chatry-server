import { CacheType } from "@typings/Cache";
import {
  editInfoUser,
  editUser,
  notificationsAddUser,
  notificationsGetUser,
} from "@database/handlers/UserHandler";
import {
  addUserChat,
  createChat,
  getChat,
  sendMessage,
} from "@database/handlers/MessengerHandler";
import { getUserDB } from "@database/handlers/getUserDB";
import searchUserDB from "@database/handlers/searchUserDB";

export const cache: CacheType = {
  chats: [],
  messages: new Map(),
  users: [],
};

export const getDatabase = () => {
  return {
    getUser: getUserDB,
    editUser: editUser,
    editInfoUser: editInfoUser,
    searchUser: searchUserDB,
    notificationsGetUser: notificationsGetUser,
    notificationsAddUser: notificationsAddUser,
    sendMessage: sendMessage,
    createChat: createChat,
    getChat: getChat,
    addUserChat: addUserChat,
  };
};
