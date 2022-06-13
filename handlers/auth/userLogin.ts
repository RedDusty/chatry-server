import { Request, Response } from "express";
import { createRefreshToken, createToken, verifyToken } from "@utils/token";
import { Password } from "@utils/password";
import { getInfoUserDB, getUserDB } from "@database/handlers/getUserDB";
import { editInfoUser } from "@database/handlers/UserHandler";
import { UserTypeClient } from "@typings/User";
import structuredClone from "@utils/structuredClone";

const userLogin = (req: Request, res: Response) => {
  let { username, password, token, uid } = req.body;

  if (token) {
    silentLogin(token, uid, res);
  } else if (username && password) {
    loginSystem(username, password, res);
  } else {
    res.status(400).send("DATA_MISSING");
  }
};

export default userLogin;

const loginSystem = async (
  username: string,
  password: string,
  res: Response
) => {
  const searchUser = await getInfoUserDB(
    "subname",
    String(username).toLowerCase()
  );

  if (searchUser) {
    const isPasswordsSame = await Password.compare(
      searchUser.password,
      password
    );

    if (isPasswordsSame) {
      const user = await getUserDB("subname", String(username).toLowerCase());

      if (user) {
        const token = await createToken(user, user.uid);
        const refreshToken = await createRefreshToken(user, user.uid, true);

        editInfoUser(user.uid, "refreshToken", refreshToken);
        const userDataClient = structuredClone(user);
        delete (userDataClient as any).editedData;

        res.status(200).json({
          uid: user.uid,
          token,
          refreshToken,
          user: userDataClient,
        });
      } else {
        res.status(404).send("USER_NOT_FOUND");
      }
    } else {
      res.status(401).send("USER_NOT_FOUND");
    }
  } else {
    res.status(404).send("USER_NOT_FOUND");
  }

  return;
};

const silentLogin = async (userToken: string, uid: string, res: Response) => {
  const token = await verifyToken(userToken, uid);

  if (token) {
    const user = await getUserDB("uid", uid);

    if (user) {
      if (token.uid === user.uid) {
        const userClient: UserTypeClient = structuredClone(user);
        delete (userClient as any).editedData;
        const newToken = await createToken(userClient, user.uid);

        res.status(200).json({
          token: newToken,
          user,
        });
      } else {
        res.status(401).send("ACCESS_TOKEN_INVALID");
        return;
      }
    } else {
      res.status(404).send("USER_NOT_FOUND");
    }
  } else {
    res.status(401).send("ACCESS_TOKEN_INVALID");
    return;
  }
};
