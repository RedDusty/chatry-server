import { CacheType } from "@typings/Cache";
import { editInfoUser, editUser } from "@database/handlers/UserHandler";
import { getUserDB } from "@database/handlers/getUserDB";
import searchUserDB from "@database/handlers/searchUserDB";
import {
  notificationsAddUser,
  notificationsGetUser,
} from "@database/handlers/notifications";
import { MessageType } from "@typings/Messenger";
import { fbFirestore } from "./firebase";

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

export const updater = () => {
  const chatsToUpdate = cache.chats.filter(
    (c) => c.existsInDB === false || c.editedData === true
  );

  const messagesToUpdate: MessageType[] = [];
  cache.messages.forEach((m) => {
    m.forEach((v) => {
      if (v.editedData === true || v.existsInDB === false) {
        messagesToUpdate.push(v);
      }
    });
  });
  

  chatsToUpdate.forEach(async (c) => {
    const doc = c;
    if (c.existsInDB === false) {
      doc.existsInDB = true;
      doc.editedData = false;

      await fbFirestore.collection("chats").doc(c.cid).set(doc);
    } else if (c.existsInDB === true && c.editedData === true) {
      doc.editedData = false;
      await fbFirestore
        .collection("chats")
        .doc(c.cid)
        .set(doc, { merge: true });
    }
  });

  messagesToUpdate.forEach(async (m) => {
    const doc = m;
    if (m.existsInDB === false) {
      doc.editedData = false;
      doc.existsInDB = true;

      await fbFirestore
        .collection("chats")
        .doc(m.cid)
        .collection("messages")
        .doc("msg" + doc.mid)
        .set(doc);
    } else if (m.existsInDB === true && m.editedData === true) {
      doc.editedData = false;
      await fbFirestore
        .collection("chats")
        .doc(m.cid)
        .collection("messages")
        .doc("msg" + m.mid)
        .set(doc, { merge: true });
    }
  });
};
