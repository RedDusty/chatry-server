import { sign } from "crypto";
import { getDatabase } from "@database/cache";
import { fbAuth } from "@database/firebase";
import { Request, Response } from "express";
import { getAuth, signInWithEmailAndPassword, signOut } from "firebase/auth";

import jwt from "jsonwebtoken";
import { tokensType, UserType } from "@typings/User";
import { decryptData, encryptData } from "@utils/cryptData";

const userLogin = (req: Request, res: Response) => {
  let { email, password } = req.body;
  const cookieAccessToken = req.cookies.accessToken;
  // const cookieRefreshToken = req.cookies.refreshToken;

  if (!email && !password) {
    silentLogin(cookieAccessToken, req, res);
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

      const accessTokenCrypt = encryptData(accessToken, userCred.user.uid);
      const refreshTokenCrypt = encryptData(refreshToken, userCred.user.uid);

      const userInfo = await getDatabase().getUser("email", email);
      if (userInfo) {
        userInfo.tokens = {
          accessToken,
          refreshToken,
        };
        userInfo.online = true;
      }

      getDatabase().editUser(userCred.user.uid, "tokens", {
        refreshToken: refreshToken,
        accessToken: accessToken,
      } as tokensType);

      if (userInfo) {
        res
          .status(200)
          .cookie("accessToken", accessTokenCrypt, {
            httpOnly: false,
            expires: new Date(new Date().getTime() + 1000 * 60 * 60 * 24 * 7),
            domain: process.env.clientURL,
          })
          .cookie("refreshToken", refreshTokenCrypt, {
            httpOnly: false,
            expires: new Date(
              new Date().getTime() + 1000 * 60 * 60 * 24 * 365 * 10
            ),
            domain: process.env.clientURL,
          })
          .cookie("uid", userCred.user.uid, {
            httpOnly: false,
            expires: new Date(
              new Date().getTime() + 1000 * 60 * 60 * 24 * 365 * 10
            ),
            domain: process.env.clientURL,
          })
          .json(userInfo as UserType);
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

const silentLogin = (accessToken: any, req: Request, res: Response) => {
  const uid: string = req.cookies.uid;

  if (uid) {
    const token = jwt.decode(decryptData(accessToken, uid)) as any;

    const email = token.email;
    const password = token.password;

    if (email && password) {
      loginSystem(email, password, res);
      return;
    }
  }

  res.status(401).send("ACCESS_TOKEN_INVALID");
  return;
};
