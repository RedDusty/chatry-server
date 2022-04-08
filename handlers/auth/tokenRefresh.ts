import { getInfoUserDB, getUserDB } from "@database/handlers/getUserDB";
import { editInfoUser } from "@database/handlers/UserHandler";
import { UserType } from "@typings/User";
import { createRefreshToken, createToken } from "@utils/token";
import { Request, Response } from "express";
import jwt from "jsonwebtoken";

const tokenRefresh = async (req: Request, res: Response) => {
  const refreshToken = req.body.token;
  const uid = req.body.uid;

  if (!refreshToken) return res.status(401).send("NOT_AUTHENTICATED");

  const isExist = await getInfoUserDB("refreshToken", refreshToken);

  if (!isExist) return res.status(403).send("TOKEN_NOT_VALID");

  jwt.verify(refreshToken, uid + "refresh", async (err: any, payload: any) => {
    if (err) {
      console.log(err);
      res.status(500).send("UNKNOWN_ERROR");
      return;
    }

    const user = await getUserDB("uid", uid);

    if (user) {
      const newToken = await createToken(user, uid);
      const newRefreshToken = await createRefreshToken(user, uid, true);

      editInfoUser(uid, "refreshToken", newRefreshToken);

      res.status(200).json({
        token: newToken,
        refreshToken: newRefreshToken,
        user,
      });
      return;
    } else {
      res.status(404).send("USER_NOT_FOUND");
      return;
    }
  });
};

export default tokenRefresh;
