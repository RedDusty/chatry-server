import { Request, Response } from "express";
import { getUserDB } from "@database/handlers/getUserDB";
import {
  UserPrivacyType,
  UserTypeServer,
  lastUsernamesType,
} from "@typings/User";
import { fbFirestore } from "@database/firebase";
import { isOnlineUser } from "@database/handlers/onlineUsers";
import { imageType } from '@typings/User';

type UserProfileType = {
  username: string;
  uid: string;
  online: boolean | number;
  avatar: string | null;
  privacy: UserPrivacyType;
  usernames: lastUsernamesType[];
  images: imageType[];
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
      const userProfile = UserProfileObj(user);
      let canView = userProfile.privacy.profile === "public";
      const isOwn = user.uid === userRequestUID;
      if (isOwn) {
        canView = true;
      }

      if (
        userProfile.privacy.profile !== "public" &&
        userRequestUID &&
        isOwn === false
      ) {
        const userRequest = await getUserDB("uid", userRequestUID);
        if (userProfile.privacy.profile === "private") {
          if (userRequest && userRequest.uid) canView = true;
        } else if (userProfile.privacy.profile === "friends") {
          canView = userRequest
            ? userRequest.friendsUID.includes(userProfile.uid)
            : false;
        }
      }

      if (canView === false && isOwn === false) {
        let responseTEXT = "FORBIDDEN_PRIVATE";
        if (
          userProfile.privacy.profile === "private" &&
          typeof userRequestUID !== "string"
        ) {
          responseTEXT = "FORBIDDEN_PRIVATE";
        } else if (
          userProfile.privacy.profile === "friends" &&
          userRequestUID
        ) {
          responseTEXT = "FORBIDDEN_FRIEND";
        }

        res.status(200).json({
          error: responseTEXT,
          user: {
            uid: userProfile.uid,
            privacy: userProfile.privacy,
            avatar: userProfile.avatar,
            username: userProfile.username,
            online: false,
            images: [],
            usernames: [],
          } as UserProfileType,
        });
        return;
      }

      userProfile.online = await isOnlineUser(userProfile.uid);
      const lastUsernames = await fbFirestore
        .collection("users")
        .doc(user.uid)
        .collection("usernames")
        .where("updateTime", "<", new Date().getTime())
        .orderBy("updateTime", "desc")
        .limit(3)
        .get();

      userProfile.usernames = [] as lastUsernamesType[];

      lastUsernames.forEach((u) => {
        userProfile.usernames.push(u.data() as lastUsernamesType);
      });

      res.status(200).json({
        user: userProfile,
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

function UserProfileObj(user: UserTypeServer) {
  const returnUser: UserProfileType = {
    avatar: null,
    images: [],
    online: false,
    privacy: {
      profile: "public",
      twoside: "all",
    },
    uid: "",
    username: "",
    usernames: [],
  };

  returnUser.avatar = user.avatar;
  returnUser.online = user.online;
  returnUser.privacy = user.privacy;
  returnUser.uid = user.uid;
  returnUser.username = user.username;
  returnUser.images = user.images;

  return returnUser;
}
