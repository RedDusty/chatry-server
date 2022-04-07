import { sign } from "crypto";
import { getDatabase } from "@database/cache";
import { fbAuth } from "@database/firebase";
import { Request, Response } from "express";
import { getAuth, signInWithEmailAndPassword, signOut } from "firebase/auth";

import jwt from "jsonwebtoken";
import { tokensType, UserType } from "@typings/User";

const userLogin = (req: Request, res: Response) => {
  let { email, password } = req.body;
  const accessToken = String(req.headers.authorization);

  if (!email && !password) {
    silentLogin(accessToken, req, res);
    return;
  } else {
    loginSystem(email, password, res);
  }

  return;
};

export default userLogin;

const loginSystem = (email: string, password: string, res: Response) => {
  signInWithEmailAndPassword(getAuth(), email, password)
    .then(async (userCred) => {
      const accessToken = jwt.sign(
        {
          password: password,
          email: email,
          uid: userCred.user.uid,
        },
        userCred.user.uid,
        { expiresIn: 1000 * 60 * 60 * 24 * 7 }
      );

      const refreshToken = jwt.sign(
        {
          password: password,
          email: email,
          uid: userCred.user.uid,
        },
        userCred.user.uid
      );

      const userInfo = await getDatabase().getUser("email", email);
      if (userInfo) {
        userInfo.tokens = {
          accessToken: accessToken,
          refreshToken: refreshToken,
        };
        userInfo.online = true;
      }

      getDatabase().editUser(userCred.user.uid, "tokens", {
        accessToken,
        refreshToken,
      } as tokensType);

      if (userInfo) {
        res.status(200).json(userInfo as UserType);
      } else {
        res.status(400).send("UNKNOWN_ERROR");
      }
    })
    .catch((err) => {
      console.log(err);

      switch (err.code) {
        case "auth/invalid-email":
        case "auth/invalid-password":
          res.status(401).send("INVALID_EMAIL_OR_PASSWORD");
          break;
        case "auth/user-not-found":
          res.status(404).send("USER_NOT_FOUND");
          break;
        default:
          res.status(400).send("UNKNOWN_ERROR");
          break;
      }
    })
    .finally(() => {
      signOut(getAuth());
    });

  return;
};

const silentLogin = (accessToken: string, req: Request, res: Response) => {
  const token = jwt.decode(accessToken) as any;

  try {
    const email = token.email;
    const password = token.password;

    if (email && password) {
      loginSystem(email, password, res);
      return;
    }

    res.status(401).send("ACCESS_TOKEN_INVALID");
    return;
  } catch (error) {
    res.status(401).send("ACCESS_TOKEN_INVALID");
    return;
  }
};
