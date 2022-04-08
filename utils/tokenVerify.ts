import { IRequestWithUser } from "custom";
import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

const tokenVerify = (
  req: IRequestWithUser,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const uid = authHeader.split(" ")[0];
    const token = authHeader.split(" ")[1];

    jwt.verify(token, uid, (err, user) => {
      if (err) return res.send(401).send("Token is not valid");
      req.user = user;

      next();
    });
  } else {
    res.status(401).json("You are not authenticated");
  }
};

export default tokenVerify;
