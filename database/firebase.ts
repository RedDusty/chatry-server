import admin from "firebase-admin";
import "dotenv/config";
import { FirebaseOptions, initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const serviceAccount = JSON.parse(
  process.env.FB_SERVICE_ACCOUNT!
) as admin.ServiceAccount;

serviceAccount.privateKey = serviceAccount.privateKey?.replace(/\\n/, "\n");

const firebaseConfig = {
  apiKey: process.env.FB_API_KEY,
  appId: process.env.FB_APP_ID,
  authDomain: process.env.FB_AUTH_DOMAIN,
  databaseURL: process.env.FB_DATABASE_URL,
  messagingSenderId: process.env.FB_MESSAGING_SENDER_ID,
  projectId: process.env.FB_PROJECT_ID,
  storageBucket: process.env.FB_STORAGE_BUCKET,
} as FirebaseOptions;

getApps.length ? getApp() : initializeApp(firebaseConfig);

getAuth().setPersistence({ type: "NONE" });

export const fbApp = !admin.apps.length
  ? admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: process.env.databaseURL,
    })
  : admin.app();

export const fbFirestore = admin.firestore(fbApp);

export const fbDatabase = admin.database(fbApp);

export const fbStorage = admin.storage(fbApp);

export const fbAuth = admin.auth(fbApp);
