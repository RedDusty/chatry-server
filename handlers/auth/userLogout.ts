import { editInfoUser } from "@database/handlers/UserHandler";
import { Request, Response } from "express";

const userLogout = async (req: Request, res: Response) => {
  const uid = req.body.uid;
  editInfoUser(uid, "refreshToken", "");

  res.status(200).send("LOGOUT_SUCCESS");
};

export default userLogout;
