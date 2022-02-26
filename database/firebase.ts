import admin from "firebase-admin";
import "dotenv/config";
import { FirebaseOptions, initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const serviceAccount = {
  type: process.env.FB_TYPE,
  projectId: process.env.FB_PROJECT_ID,
  privateKeyId: process.env.FB_PRIVATE_KEY_ID,
  privateKey: process.env.FB_PRIVATE_KEY?.replace(/\\n/, "\n"),
  clientEmail: process.env.FB_CLIENT_EMAIL,
  clientId: process.env.FB_CLIENT_ID,
  authUrl: process.env.FB_AUTH_URI,
  tokenUrl: process.env.FB_TOKEN_URI,
  authProviderX509CertUrl: process.env.FB_AUTH_PROVIDER_X509_CERT_URL,
  clientX509CertUrl: process.env.FB_CLIENT_X509_CERT_URL,
} as admin.ServiceAccount;

console.log(serviceAccount);


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
