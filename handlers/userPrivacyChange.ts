import { editUser } from "@database/handlers/UserHandler";
import { UserPrivacyType } from "@typings/User";

export default async function userPrivacyChange(data: any, socketID: string) {
  const privacy = data.privacy as UserPrivacyType;
  const uid = data.uid as string;

  editUser(uid, "privacy", privacy);
}
