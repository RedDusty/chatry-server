import { getUserDB } from "@database/handlers/getUserDB";
import { UserShortType } from "@typings/User";
import userShortObj from "@utils/userShortObj";
import { Request, Response } from "express";

export default async function getFriends(req: Request, res: Response) {
  const friendsUID = req.body.friendsUID as string[];
  const userUID = req.body.userUID as string;
  const list = req.body.list as undefined | "friends" | "waitings";

  if (friendsUID && userUID && list) {
    const users: UserShortType[] = [];

    for (const uid of friendsUID) {
      const userDB = await getUserDB("uid", uid);

      const user = userShortObj(userDB);

      users.push(user);
    }

    res.status(200).json(users);
    return;
  } else {
    res.status(404).send("NOT_FOUND");
    return;
  }
}
