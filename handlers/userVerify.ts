import { fbAuth } from "@database/firebase";
import { Request, Response } from "express";

const userVerify = async (req: Request, res: Response) => {
  const { email } = req.query;

  if (typeof email === "string") {
    const user = await fbAuth.getUserByEmail(email);
    
    if (user) {
      if (user.emailVerified) {
        res.status(200).send("EMAIL_VERIFIED");
        return;
      } else {
        res.status(200).send("EMAIL_NOT_VERIFIED");
        return;
      }
    } else {
      res.status(404).send("USER_NOT_FOUND");
      return;
    }
  }

  res.status(400).send("UNKNOWN_ERROR");
  return;
};

export default userVerify;
