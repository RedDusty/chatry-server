import { fbFirestore } from "@database/firebase";
import { notificationsType } from "@typings/User";
import { Request, Response } from "express";

export default async function getNotifications(req: Request, res: Response) {
  const uid = req.headers.authorization?.split(" ")[0];

  if (uid) {
    const getDoc = await fbFirestore
      .collection("Info_Users")
      .doc(uid)
      .collection("notifications")
      .orderBy("time", "desc")
      .limit(10)
      .get();

    if (getDoc.size > 0) {
      const notifs = getDoc.docs.map((doc, idx) => {
        return doc.data();
      });

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
