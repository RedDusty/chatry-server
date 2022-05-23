import { fbFirestore, fbStorage } from "@database/firebase";
import { cache } from "@database/cache";
import { imageExtType, imageType } from "@typings/Cache";
import { getUserDB } from "@database/handlers/getUserDB";
import structuredClone from "@utils/structuredClone";
import { io } from "index";

export async function getImageDB(hash: string) {
  const image = cache.images.filter((i) => i.hash === hash);

  if (image.length === 1) {
    return image[0];
  } else {
    const doc = await fbFirestore.collection("images").doc(hash).get();

    if (doc.exists) {
      cache.images.push(doc.data() as imageType);
      return doc.data() as imageType;
    } else {
      return null;
    }
  }
}

export async function setImageDB(
  hash: string,
  userUID: string,
  url: string,
  ext: imageExtType
) {
  await fbFirestore
    .collection("images")
    .doc(hash)
    .set({ hash, url, editedData: false, usersUID: [userUID] } as imageType);

  cache.images.push({ hash, url, usersUID: [userUID], editedData: false, ext });
}

export async function editImageDB(
  hash: string,
  userUID: string,
  url: string,
  ext: imageExtType
) {
  const image = await getImageDB(hash);

  if (image) {
    image.usersUID.push(userUID);

    image.usersUID = [...new Set(image.usersUID)];

    image.editedData = true;
  } else {
    await setImageDB(hash, userUID, url, ext);
  }
}

export async function deleteImageDB(
  hash: string,
  userUID: string,
  ext: imageExtType
) {
  const image = await getImageDB(hash);

  if (image) {
    const udx = image.usersUID.indexOf(userUID);

    if (udx !== -1) {
      image.usersUID.splice(udx, 1);
      image.editedData = true;
    }

    if (image.usersUID.length === 0) {
      const idx = cache.images.findIndex((i) => i.hash === hash);
      cache.images.splice(idx, 1);

      await fbFirestore.collection("images").doc(hash).delete();

      const bucket = fbStorage.bucket(process.env.FB_STORAGE_BUCKET);

      bucket.file(`images/${hash}.${ext}`).delete({ ignoreNotFound: true });
    }
  }
}

export async function deleteImageUser(data: any, socketID: string) {
  const uid = data.uid as string;
  const image = data.image as imageType;

  if (uid && image) {
    const user = await getUserDB("uid", uid);

    if (user) {
      const images = user.images.filter((i) => i.hash !== image.hash);

      deleteImageDB(image.hash, user.uid, image.ext);

      user.editedData = true;
      user.images = images;

      const userSend = structuredClone(user);

      delete (userSend as any).editedData;

      io.to(socketID).emit("USER_EDIT", userSend);
    }
  }
}
