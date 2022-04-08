import "dotenv/config";
import { Request, Response } from "express";
import * as crypto from "crypto";
import { fbFirestore } from "@database/firebase";
import { InfoUserType, notificationsType, UserType } from "@typings/User";
import { Password } from "@utils/password";
import { createRefreshToken, createToken } from "@utils/token";

export default async function userRegister(req: Request, res: Response) {
  const username: string = req.body.username;
  const password: string = req.body.password;

  if (username.length < 4 || username.length > 16) {
    res.status(400).send("USERNAME_LENGTH");
    return;
  }

  if (password.length < 6 || password.length > 24) {
    res.status(400).send("PASSWORD_LENGTH");
    return;
  }

  const hashedPassword: string = await Password.toHash(password);

  const searchSubname = await fbFirestore
    .collection("Info_Users")
    .where("subname", "==", String(username).toLowerCase())
    .get();

  if (searchSubname.size > 0) {
    res.status(403).send("USER_EXISTS");
    return;
  }

  let uid: string;
  let isUnique = false;

  do {
    uid = crypto.randomUUID();
    const searchUUID = await fbFirestore
      .collection("users")
      .where("uid", "==", uid)
      .get();
    if (searchUUID.size > 0) {
      isUnique = false;
    } else {
      isUnique = true;
    }
  } while (isUnique === false);

  const userData = {
    username: username,
    verified: true,
    uid: uid,
    registerDate: new Date().getTime(),
    subname: String(username).toLowerCase(),
    avatar: null,
    online: new Date().getTime(),
    banned: false,
  } as UserType;

  const token = await createToken(userData, uid);
  const refreshToken = await createRefreshToken(userData, uid, false);

  await fbFirestore
    .collection("users")
    .doc(uid)
    .set(userData)
    .then(async () => {
      await fbFirestore
        .collection("Info_Users")
        .doc(uid)
        .set({
          ip: [req.ip],
          subname: String(username).toLowerCase(),
          password: hashedPassword,
          uid: uid,
          refreshToken: refreshToken,
        } as InfoUserType)
        .then(() => {
          fbFirestore
            .collection("Info_Users")
            .doc(uid)
            .collection("notifications")
            .add({
              time: new Date().getTime(),
              header: "Account registered",
              data: "You have more options available to you on the website.",
            } as notificationsType);
          res.status(200).json({
            status: "ok",
            uid,
            token,
            refreshToken,
            user: userData,
          });
          return;
        })
        .catch(() => {
          res.status(400).send("UNKNOWN_ERROR");
          return;
        });
    })
    .catch(() => {
      res.status(400).send("UNKNOWN_ERROR");
      return;
    });
}
