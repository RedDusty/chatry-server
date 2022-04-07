import { fbAuth, fbFirestore } from "@database/firebase";
import { Request, Response } from "express";
import { UserRecord } from "firebase-admin/lib/auth/user-record";
import "dotenv/config";
import sendEmailVerify from "@utils/sendEvailVerify";
import { getDatabase } from "@database/cache";
import { InfoUserType, notificationsType, UserType } from "@typings/User";

const userRegister = async (req: Request, res: Response) => {
  const { email, password, username } = req.body;

  let user: UserRecord | null;

  try {
    user = await fbAuth.getUserByEmail(email);

    if (user) {
      res.status(403).send("USER_EXISTS");
      return;
    }

    return;
  } catch (error: any) {
    if (error.code === "auth/user-not-found") {
      user = await fbAuth.createUser({
        email: email,
        password: password,
        displayName: username,
      });
      const link = await fbAuth.generateEmailVerificationLink(email, {
        url: process.env.clientURL + "/auth/verify?email=" + email,
      });

      userCreate(email, user.uid, req.ip, username);
      sendEmailVerify(email, link);

      res.status(200).send("EMAIL_SEND");
      return;
    }
    console.log(error);

    res.status(400).send("UNKNOWN_ERROR");
    return;
  }
};

export default userRegister;

const userCreate = async (
  email: string,
  uid: string,
  ip: string,
  displayName?: string
) => {
  const user = await getDatabase().getUser("uid", uid);
  const isVerified = user?.verified;

  if (isVerified === undefined || isVerified === false) {
    fbFirestore
      .collection("users")
      .doc(uid)
      .set({
        email: email,
        displayName: displayName,
        verified: true,
        uid: uid,
        registerDate: new Date().getTime(),
        subname: displayName?.toLowerCase(),
        avatar: null,
      } as UserType);

    fbFirestore
      .collection("Info_Users")
      .doc(uid)
      .set({ ip: [ip] } as InfoUserType)
      .then(() => {
        fbFirestore
          .collection("Info_Users")
          .doc(uid)
          .collection("notifications")
          .add({
            time: new Date().getTime(),
            header: "Account verified",
            data: "You can now use website",
          } as notificationsType);
      });
  }
};
