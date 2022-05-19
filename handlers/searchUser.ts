import { getUserDB } from "@database/handlers/getUserDB";
import { isOnlineUser } from "@database/handlers/onlineUsers";
import searchUserDB from "@database/handlers/searchUserDB";
import { UserShortType, UserTypeServer } from "@typings/User";
import userShortObj from "@utils/userShortObj";
import { Request, Response } from "express";

type keyType = "uid" | "username" | "subname";

export default async function searchUser(req: Request, res: Response) {
  const key = req.body.key as keyType;
  const value = req.body.value as string;
  const userUID = req.body.userUID as string;
  const list = req.body.list as undefined | "friends" | "waitings" | "search";

  let users: UserShortType[] = [];
  const userRequest = await getUserDB("uid", userUID);

  if ((list === "search" || list === undefined) && value) {
    if (key === "subname") {
      users = await searchUserDB(key, String(value).toLowerCase(), userUID);
    } else {
      users = await searchUserDB(key, value, userUID);
    }

    for (let idx = 0; idx < users.length; idx++) {
      const user = users[idx];
      let canView = user.privacy.profile === "public";

      if (user.privacy.profile !== "public" && userUID) {
        if (user.privacy.profile === "private") {
          if (userRequest && userRequest.uid) canView = true;
        } else if (user.privacy.profile === "friends") {
          canView = userRequest
            ? userRequest.friendsUID.includes(user.uid)
            : false;
        }
      }

      if (canView === false) {
        user.online = false;
        user.usernames = undefined;
      } else {
        user.online = await isOnlineUser(user.uid);
      }
    }
  } else if (list === "friends") {
    if (userRequest) {
      const friendsUID = userRequest.friendsUID;

      for (let idx = 0; idx < friendsUID.length; idx++) {
        const userFriend = await getUserDB("uid", friendsUID[idx]);

        users.push(userShortObj(userFriend));
      }
    } else {
      res.status(403).send("UNAUTHORIZED");
      return;
    }
  } else if (list === "waitings") {
    if (userRequest) {
      const waitingsUID = userRequest.waitingsUID;

      for (let idx = 0; idx < waitingsUID.length; idx++) {
        let userWaiting: UserTypeServer | UserShortType | null =
          await getUserDB("uid", waitingsUID[idx]);

        userWaiting = userShortObj(userWaiting);

        let canView = userWaiting.privacy.profile === "public";

        if (userWaiting.privacy.profile !== "public" && userUID) {
          if (userWaiting.privacy.profile === "private") {
            if (userRequest && userRequest.uid) canView = true;
          } else if (userWaiting.privacy.profile === "friends") {
            canView = userRequest
              ? userRequest.friendsUID.includes(userWaiting.uid)
              : false;
          }
        }

        if (canView === false) {
          userWaiting.online = false;
          userWaiting.usernames = undefined;
        } else {
          userWaiting.online = await isOnlineUser(userWaiting.uid);
        }

        users.push(userWaiting);
      }
    } else {
      res.status(403).send("UNAUTHORIZED");
      return;
    }
  }

  res.status(200).json(users);
  return;
}
