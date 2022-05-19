import { Request, Response } from "express";
import { getUserDB } from "@database/handlers/getUserDB";
import { UserPrivacyType, UserShortType, UserTypeServer } from "@typings/User";
import userShortObj from "@utils/userShortObj";
import { fbFirestore } from "@database/firebase";
import { isOnlineUser } from "@database/handlers/onlineUsers";

type lastUsernamesType = {
  updateTime: number;
  username: string;
};

export default async function getUserProfile(req: Request, res: Response) {
  const userUID = req.query.user;
  const userRequestUID =
    req.headers.authorization && req.headers.authorization.split(" ")[0];

  if (userUID && typeof userUID === "string") {
    let user = (await getUserDB(
      "subname",
      String(userUID).toLowerCase()
    )) as UserTypeServer | null;

    if (user === null) {
      user = (await getUserDB("uid", userUID)) as UserTypeServer | null;
    }

    if (user) {
      const userShort = userShortObj(user) as UserShortType;
      let canView = userShort.privacy.profile === "public";
      const isOwn = user.uid === userRequestUID;
      if (isOwn) {
        canView = true;
      }

      if (
        userShort.privacy.profile !== "public" &&
        userRequestUID &&
        isOwn === false
      ) {
        const userRequest = await getUserDB("uid", userRequestUID);
        if (userShort.privacy.profile === "private") {
          if (userRequest && userRequest.uid) canView = true;
        } else if (userShort.privacy.profile === "friends") {
          canView = userRequest
            ? userRequest.friendsUID.includes(userShort.uid)
            : false;
        }
      }

      if (canView === false && isOwn === false) {
        let responseTEXT = "FORBIDDEN_PRIVATE";
        if (
          userShort.privacy.profile === "private" &&
          typeof userRequestUID !== "string"
        ) {
          responseTEXT = "FORBIDDEN_PRIVATE";
        } else if (userShort.privacy.profile === "friends" && userRequestUID) {
          responseTEXT = "FORBIDDEN_FRIEND";
        }

        res.status(200).json({
          error: responseTEXT,
          user: {
            uid: userShort.uid,
            privacy: userShort.privacy,
            avatar: userShort.avatar,
            username: userShort.username,
            online: false,
          } as UserShortType,
        });
        return;
      }

      userShort.online = await isOnlineUser(userShort.uid);
      const lastUsernames = await fbFirestore
        .collection("users")
        .doc(user.uid)
        .collection("usernames")
        .where("updateTime", "<", new Date().getTime())
        .orderBy("updateTime", "desc")
        .limit(3)
        .get();

      userShort.usernames = [] as lastUsernamesType[];

      lastUsernames.forEach((u) => {
        userShort.usernames!.push(u.data() as lastUsernamesType);
      });

      res.status(200).json({
        user: userShort,
      });
      return;
    } else {
      res.status(200).json({
        error: "NOT_FOUND",
        user: undefined,
      });
      return;
    }
  }

  res.status(200).json({
    error: "NOT_FOUND",
    user: undefined,
  });
  return;
}
