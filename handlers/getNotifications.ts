import { firestore } from "firebase-admin";
import { notificationsGetUser } from "@database/handlers/notifications";
import { Request, Response } from "express";

export default async function getNotifications(req: Request, res: Response) {
  const uid = req.headers.authorization?.split(" ")[0];

  if (uid) {
    const notifs = await notificationsGetUser(uid);

    if (notifs.length > 0) {
      res.status(200).json(notifs);
      return;
    } else {
      res.status(404).send("NOTIFICATIONS_END");
      return;
    }
  }

  res.status(404).send("NOT_FOUND");
  return;
}
