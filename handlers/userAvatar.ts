import { randomUUID } from "crypto";
import { fbApp, fbFirestore, fbStorage } from "@database/firebase";
import { Request, Response } from "express";
import { Stream } from "stream";
import userCheck from "@utils/userCheck";
import { UploadedFile } from "express-fileupload";
import { Buffer } from "buffer";

export default async function userAvatar(req: Request, res: Response) {
  try {
    const blob = (req.files!.avatar as UploadedFile).data;
    
    let base64 = blob.toString();

    if (base64.includes("jpeg") || base64.includes("webp")) {
      base64 = base64.substring(20);
    } else if (base64.includes("jpg") || base64.includes("png")) {
      base64 = base64.substring(19);
    }

    const userUID = await userCheck(req, res);

    if (userUID) {
      try {
        const stream = new Stream.PassThrough();
        stream.end(Buffer.from(base64, "base64"));

        const bucket = fbStorage.bucket(process.env.FB_STORAGE_BUCKET);

        const file = bucket.file(`users/${userUID}/avatar.png`);

        const uuid = randomUUID({ disableEntropyCache: true });

        stream
          .pipe(
            file.createWriteStream({
              metadata: {
                contentType: "image/png",
                metadata: {
                  firebaseStorageDownloadTokens: uuid,
                },
              },
            })
          )
          .on("finish", async () => {
            await fbFirestore
              .collection("users")
              .doc(userUID)
              .update({
                avatar: `https://firebasestorage.googleapis.com/v0/b/${
                  bucket.name
                }/o/${encodeURIComponent(file.name)}?alt=media&token=${uuid}`,
              });
          });

        res.status(200).send("OK");
        return;
      } catch (error: any) {
        console.log(error);

        res.status(400).send(error.code);
        return;
      }
    }

    res.status(400).send("NOT_ALLOWED");
    return;
  } catch (error) {
    console.log(error);

    res.status(400).send("NOT_ALLOWED");
    return;
  }
}
