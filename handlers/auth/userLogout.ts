import { removeOnlineUser } from "@database/handlers/onlineUsers";
import { editInfoUser } from "@database/handlers/UserHandler";
import { Request, Response } from "express";

const userLogout = async (req: Request, res: Response) => {
  const uid = req.body.uid;
  if (uid) {
    removeOnlineUser(undefined, uid);
    res.status(200).send("LOGOUT_SUCCESS");
  } else {
    res.status(403).send("UNKNOWN_ERROR");
  }
};

export default userLogout;
