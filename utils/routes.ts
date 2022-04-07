import { cache } from "@database/cache";
import { searchChat } from "@database/handlers/MessengerHandler";
import {
  getUser,
  notificationsGetUser,
  searchUser,
} from "@database/handlers/UserHandler";
import express, { Request, Response } from "express";
import tokenRefresh from "@handlers/tokenRefresh";
import userAvatar from "@handlers/userAvatar";
import userLogin from "@handlers/userLogin";
import userRegister from "@handlers/userRegister";
import userVerify from "@handlers/userVerify";
import { UserType } from "@typings/User";
import removeKey from "@utils/removeKey";
import friendRequest from "@handlers/friendRequest";
import userCheck from "@utils/userCheck";

export const expressRoutes = express.Router();

expressRoutes.post("/api/login", userLogin);
expressRoutes.post("/api/register", userRegister);
expressRoutes.post("/api/refresh", tokenRefresh);

expressRoutes.get("/api/verify", userVerify);

expressRoutes.post("/api/avatar", userAvatar);

expressRoutes.post("/api/friendRequest", friendRequest);

expressRoutes.get("/api/user", async (req: Request, res: Response) => {
  const userUID = req.query.uid;

  if (userUID && typeof userUID === "string") {
    let user = (await getUser("uid", userUID)) as UserType;

    if (user) {
      const isOnline = cache.users.findIndex((u) => u.userUID === user.uid);
      user = removeKey(user, "tokens");
      user = removeKey(user, "userSettings");
      user = removeKey(user, "socketID");
      user = removeKey(user, "email");
      user.online = isOnline !== -1 ? true : user.online;

      res.status(200).json(user);
      return;
    }
  }

  res.status(404).send("NOT_FOUND");
  return;
});

expressRoutes.post("/api/search/users", async (req: Request, res: Response) => {
  const key = req.body.key;
  const value = req.body.value;
  const userUID = req.body.userUID as string;

  if (key && value && typeof key === "string" && typeof value === "string") {
    const users = await searchUser(
      String(key) as keyof UserType,
      String(value),
      userUID
    );

    res.status(200).json(users);
  } else {
    res.status(404).send("NOT_FOUND");
  }
});

expressRoutes.get("/api/search/chats", async (req: Request, res: Response) => {
  const nameOrID = req.query.value;

  if (nameOrID && typeof nameOrID === "string") {
    const chats = await searchChat(String(nameOrID));

    res.status(200).json(chats);
  } else {
    res.status(404).send("NOT_FOUND");
  }
});

expressRoutes.get("/api/notifications", async (req: Request, res: Response) => {
  const userUID = await userCheck(req, res);

  console.log(userUID);
  

  if (userUID) {
    const notifs = await notificationsGetUser(userUID);

    res.status(200).json(notifs);
  }

  res.status(404).send("NOT_FOUND");
});
