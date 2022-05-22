import { fbStorage } from "@database/firebase";
import { getImageDB, setImageDB } from "@database/handlers/imageDB";
import { getUserDB } from "@database/handlers/getUserDB";
import { createHash, randomUUID } from "crypto";
import { io } from "index";
import fileType from "magic-bytes.js";
import { Stream } from "stream";
import { editUser } from "@database/handlers/UserHandler";

const allowedFiles = [
  "image/png",
  "image/jpg",
  "image/jpeg",
  "image/gif",
  "image/webp",
];

type fileType = {
  file: Buffer;
  id: number;
};

async function imagesUpload(data: any, socketID: string) {
  const files = data.files as fileType[];
  const uid = data.uid as string;

  const user = await getUserDB("uid", uid);

  if (user) {
    const filesParsed: number[] = [];
    const uploadedIDs: number[] = [];
    const notUploadedIDs: number[] = [];
    const urls: string[] = [];

    const sendResponse = (uploadID: number, imageURL: string, idx: number) => {
      uploadedIDs.push(uploadID);
      urls.push(imageURL);
      filesParsed.push(idx);

      if (filesParsed.length === files.length) {
        files.forEach((f) => {
          if (uploadedIDs.includes(f.id) === false) {
            notUploadedIDs.push(f.id);
          }
        });
        if (urls.length !== 0) {
          editUser(user.uid, "images", urls);
        }
        if (notUploadedIDs.length !== 0) {
          io.to(socketID).emit("IMAGE_UPLOAD_CLIENT", {
            error: "USER_UPLOAD_ERROR",
            notUploadedIDs: notUploadedIDs,
          });
        }
      }
      io.to(socketID).emit("IMAGE_UPLOAD_CLIENT", {
        uploadID,
      });
    };

    for (let idx = 0; idx < files.length; idx++) {
      const buffer = files[idx].file;

      const bufferInfo = fileType(buffer);

      if (bufferInfo && bufferInfo[0]) {
        const fileExt = bufferInfo[0].extension;
        const fileMime = bufferInfo[0].mime;

        if (fileExt && fileMime && allowedFiles.includes(fileMime)) {
          const base64 = Buffer.from(buffer).toString("base64");

          const imageHash = createHash("md5").update(base64).digest("hex");

          const isExist = await getImageDB(imageHash);
          const uploadID = files[idx].id;

          if (isExist) {
            sendResponse(uploadID, isExist.url, idx);
            continue;
          } else {
            try {
              const stream = new Stream.PassThrough();
              stream.end(Buffer.from(base64, "base64"));

              const bucket = fbStorage.bucket(process.env.FB_STORAGE_BUCKET);

              const file = bucket.file(`images/${imageHash}.${fileExt}`);

              stream
                .pipe(
                  file.createWriteStream({
                    metadata: {
                      contentType: fileMime,
                      metadata: {
                        firebaseStorageDownloadTokens: imageHash,
                        mime: fileMime,
                        ext: fileExt,
                      },
                    },
                  })
                )
                .on("finish", async () => {
                  const imageURL =
                    "https://firebasestorage.googleapis.com/v0/b/" +
                    bucket.name +
                    "/o/images%2F" +
                    imageHash +
                    "." +
                    fileExt +
                    "?alt=media&token=" +
                    imageHash;

                  setImageDB(imageHash, user.uid, imageURL);

                  sendResponse(uploadID, imageURL, idx);
                  return;
                });
              continue;
            } catch (e: any) {
              filesParsed.push(idx);
              io.to(socketID).emit("IMAGE_UPLOAD_CLIENT", {
                error: "UNKNOWN",
              });
              continue;
            }
          }
        } else filesParsed.push(idx);
      } else filesParsed.push(idx);
    }
  } else {
    io.to(socketID).emit("IMAGE_UPLOAD_CLIENT", {
      error: "USER_AUTH",
    });
    return;
  }
}

export default imagesUpload;
