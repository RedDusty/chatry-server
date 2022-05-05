import { CacheType } from "@typings/Cache";
import { editInfoUser, editUser } from "@database/handlers/UserHandler";
import { getUserDB } from "@database/handlers/getUserDB";
import searchUserDB from "@database/handlers/searchUserDB";
import {
  notificationsAddUser,
  notificationsGetUser,
} from "@database/handlers/notifications";

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
  };
};
