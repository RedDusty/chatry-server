import { CacheType } from "@typings/Cache";
import { MessageType } from "@typings/Messenger";
import structuredClone from '@utils/structuredClone';
import { fbFirestore } from "./firebase";

export const cache: CacheType = {
  chats: [],
  messages: new Map(),
  users: [],
  images: [],
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

  const usersToUpdate = cache.users.filter((u) => u.info.editedData === true);

  usersToUpdate.forEach(async (u) => {
    u.info.editedData = false
    const doc = structuredClone(u.info);

    await fbFirestore.collection("users").doc(doc.uid).set(doc);
  })
};
