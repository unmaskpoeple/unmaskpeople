import { getApps, initializeApp, cert, getApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

let adminApp;

if (getApps().length === 0) {
  try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      adminApp = initializeApp({
        credential: cert(serviceAccount),
      });
    } else if (process.env.FIREBASE_PROJECT_ID) {
      adminApp = initializeApp({
        projectId: process.env.FIREBASE_PROJECT_ID,
      });
    }
  } catch (error) {
    console.warn("Firebase Admin SDK initialization skipped:", error);
  }
} else {
  adminApp = getApp();
}

export const adminAuth = adminApp ? getAuth(adminApp) : null;
export const adminDb = adminApp ? getFirestore(adminApp) : null;
export default adminApp;
