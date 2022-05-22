import { fbFirestore } from "@database/firebase";
import { cache } from "@database/cache";
import { imageType } from "@typings/Cache";

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

export async function setImageDB(hash: string, userUID: string, url: string) {
  await fbFirestore
    .collection("images")
    .doc(hash)
    .set({ hash, url } as imageType);

  cache.images.push({ hash, url });
}
