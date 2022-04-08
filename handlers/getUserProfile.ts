import { Request, Response } from "express";
import { cache } from "@database/cache";
import { getUserDB } from "@database/handlers/getUserDB";
import { UserType } from "@typings/User";
import userShortObj from "@utils/userShortObj";

export default async function getUserProfile(req: Request, res: Response) {
  const userUID = req.query.user;

  if (userUID && typeof userUID === "string") {
    let user = (await getUserDB("subname", userUID)) as UserType | null;

    if (user === null) {
      user = (await getUserDB("uid", userUID)) as UserType | null;
    }

    if (user) {
      const isOnline = cache.users.findIndex((u) => u.userUID === user!.uid);
      const userShort = userShortObj(user);
      userShort.online = isOnline !== -1 ? true : userShort.online;

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
