import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { decryptData } from "./cryptData";

export default async function userCheck(req: Request, res: Response) {
  const uid: string = req.cookies.uid;
  const cookieAccessToken = req.cookies.accessToken;
  const token = jwt.decode(decryptData(cookieAccessToken, uid)) as any;

  const email = token.email;
  const password = token.password;

  try {
    const userCred = await signInWithEmailAndPassword(
      getAuth(),
      email,
      password
    );

    const userUID = userCred.user.uid;

    return userUID;
  } catch (error) {
    return null;
  }
}
