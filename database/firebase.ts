import admin from "firebase-admin";
import "dotenv/config";

const serviceAccount = JSON.parse(
  process.env.FB_SERVICE_ACCOUNT!
) as admin.ServiceAccount;

serviceAccount.privateKey = serviceAccount.privateKey?.replace(/\\n/, "\n");
