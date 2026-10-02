import { auth, db } from "@/lib/firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";

export async function registerWithFirebase(name: string, email: string, password: string) {
  const cleanEmail = email.trim().toLowerCase();

  // 1. If Firebase Auth is initialized, create Firebase user
  let firebaseUid = "";
  if (auth) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
      firebaseUid = userCredential.user.uid;

      // 2. Save profile in Firestore
      if (db) {
        try {
          await setDoc(doc(db, "users", firebaseUid), {
            id: firebaseUid,
            uid: firebaseUid,
            name: name.trim(),
            email: cleanEmail,
            role: cleanEmail === "zh@gmail.com" ? "ADMIN" : "USER",
            walletBalance: 0.0,
            status: "ACTIVE",
            createdAt: new Date().toISOString(),
          });
        } catch (firestoreErr) {
          console.warn("Firestore profile creation warning:", firestoreErr);
        }
      }
    } catch (fbErr: any) {
      // If user already exists in Firebase, continue to session sync
      if (fbErr.code !== "auth/email-already-in-use") {
        throw new Error(fbErr.message || "Firebase registration failed.");
      }
    }
  }

  // 3. Synchronize session with backend API
  const syncRes = await fetch("/api/auth/firebase-sync", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: cleanEmail,
      name: name.trim(),
      uid: firebaseUid,
    }),
  });

  const syncData = await syncRes.json();
  if (!syncRes.ok) {
    throw new Error(syncData.error || "Failed to establish user session.");
  }

  return syncData;
}

export async function loginWithFirebase(email: string, password: string) {
  const cleanEmail = email.trim().toLowerCase();

  let firebaseUid = "";
  let userName = cleanEmail.split("@")[0];

  // 1. Authenticate with Firebase if configured
  if (auth) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password);
      firebaseUid = userCredential.user.uid;

      // Fetch user profile from Firestore if available
      if (db) {
        try {
          const userDoc = await getDoc(doc(db, "users", firebaseUid));
          if (userDoc.exists()) {
            userName = userDoc.data().name || userName;
          }
        } catch (e) {
          console.warn("Firestore fetch error:", e);
        }
      }
    } catch (fbErr: any) {
      // If Firebase auth fails with wrong password or user not found, try backend fallback
      console.warn("Firebase auth warning:", fbErr.code);
      if (fbErr.code === "auth/wrong-password" || fbErr.code === "auth/invalid-credential") {
        throw new Error("Invalid email or password.");
      }
    }
  }

  // 2. Synchronize with backend API session
  const res = await fetch("/api/auth/firebase-sync", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: cleanEmail,
      name: userName,
      uid: firebaseUid,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Login failed.");
  }

  return data;
}

export async function logoutWithFirebase() {
  if (auth) {
    try {
      await signOut(auth);
    } catch (e) {
      console.warn("Firebase signout error:", e);
    }
  }
  await fetch("/api/auth/logout", { method: "POST" });
}
