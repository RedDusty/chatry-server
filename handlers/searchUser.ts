import searchUserDB from "@database/handlers/searchUserDB";
import { UserShortType } from "@typings/User";
import { Request, Response } from "express";

export default async function searchUser(req: Request, res: Response) {
  const key = req.body.key;
  const value = req.body.value;
  const userUID = req.body.userUID as string;

  if (key && value && typeof key === "string" && typeof value === "string") {
    let users: UserShortType[] = [];
    
    if (value.startsWith("#")) {
      users = await searchUserDB("uid", value.substring(1), userUID);
    } else {
      users = await searchUserDB("subname", value, userUID);
    }

    res.status(200).json(users);
  } else {
    res.status(404).send("NOT_FOUND");
  }
}
