import { Request, Response } from "express";
import { cache } from "@database/cache";
import { getUserDB } from "@database/handlers/getUserDB";
import { UserPrivacyType, UserTypeServer } from "@typings/User";
import userShortObj from "@utils/userShortObj";
import { fbFirestore } from "@database/firebase";
import { isOnlineUser } from "@database/handlers/onlineUsers";

type lastUsernamesType = {
  updateTime: number;
  username: string;
};

type UserProileType = {
  username: string;
  online: number | boolean;
  avatar: string | null;
  privacy: UserPrivacyType;
  uid: string;
  usernames: lastUsernamesType[];
};

export default async function getUserProfile(req: Request, res: Response) {
  const userUID = req.query.user;

  if (userUID && typeof userUID === "string") {
    let user = (await getUserDB(
      "subname",
      String(userUID).toLowerCase()
    )) as UserTypeServer | null;

    if (user === null) {
      user = (await getUserDB("uid", userUID)) as UserTypeServer | null;
    }

    if (user) {
      const userShort = userShortObj(user) as UserProileType;
      userShort.online = await isOnlineUser(userShort.uid);
      const lastUsernames = await fbFirestore
        .collection("users")
        .doc(user.uid)
        .collection("usernames")
        .where("updateTime", "<", new Date().getTime())
        .orderBy("updateTime", "desc")
        .limit(3)
        .get();

      userShort["usernames"] = [];

      lastUsernames.forEach((u) => {
        userShort.usernames.push(u.data() as lastUsernamesType);
      });

      res.status(200).json(userShort);
      return;
    } else {
      res.status(404).send("NOT_FOUND");
      return;
    }
  }

  res.status(404).send("NOT_FOUND");
  return;
}
