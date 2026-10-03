import { auth, db } from "@/lib/firebase";
import { FS_COLLECTIONS } from "@/lib/collections";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";

/**
 * Register a new user with Firebase Authentication and synchronize session
 */
export async function registerWithFirebase(name: string, email: string, password: string) {
  const cleanEmail = email.trim().toLowerCase();

  // 1. If Firebase Auth is initialized, create Firebase user
  let firebaseUid = "";
  if (auth) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
      firebaseUid = userCredential.user.uid;

      // 2. Save profile in namespaced NumVerge users collection
      if (db) {
        try {
          await setDoc(doc(db, FS_COLLECTIONS.USERS, firebaseUid), {
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
      if (fbErr.code === "auth/email-already-in-use") {
        throw new Error("An account with this email address already exists. Please sign in instead.");
      } else if (fbErr.code === "auth/weak-password") {
        throw new Error("Password is too weak. Please use at least 8 characters.");
      } else if (fbErr.code === "auth/invalid-email") {
        throw new Error("Please enter a valid email address.");
      } else {
        console.warn("Firebase registration warning:", fbErr);
        // Continue to backend sync if auth client has issues
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

/**
 * Authenticate existing user with Firebase Authentication and synchronize session
 */
export async function loginWithFirebase(email: string, password: string) {
  const cleanEmail = email.trim().toLowerCase();

  let firebaseUid = "";
  let userName = cleanEmail.split("@")[0];
  let firebaseAuthSucceeded = false;

  // 1. Authenticate with Firebase Auth
  if (auth) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password);
      firebaseUid = userCredential.user.uid;
      firebaseAuthSucceeded = true;

      // Fetch user profile from Firestore if available
      if (db) {
        try {
          const userDoc = await getDoc(doc(db, FS_COLLECTIONS.USERS, firebaseUid));
          if (userDoc.exists()) {
            userName = userDoc.data().name || userName;
          }
        } catch (e) {
          console.warn("Firestore fetch error:", e);
        }
      }
    } catch (fbErr: any) {
      console.warn("Firebase auth warning:", fbErr.code);
      if (fbErr.code === "auth/wrong-password" || fbErr.code === "auth/invalid-credential") {
        // Fallback to backend DB in case account was initialized with local password
        try {
          const fallbackRes = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: cleanEmail, password }),
          });
          const fallbackData = await fallbackRes.json();
          if (fallbackRes.ok && fallbackData.user) {
            return fallbackData;
          }
        } catch {}

        throw new Error("Invalid email or password.");
      } else if (fbErr.code === "auth/user-not-found") {
        // Check local backend
        const fallbackRes = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: cleanEmail, password }),
        });
        const fallbackData = await fallbackRes.json();
        if (fallbackRes.ok && fallbackData.user) {
          return fallbackData;
        }
        throw new Error("No account found with this email. Please register first.");
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

/**
 * Sign in or sign up seamlessly with Google via Firebase Auth
 */
export async function loginWithGoogle() {
  if (!auth) {
    throw new Error("Firebase Authentication is not available.");
  }

  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });

  const result = await signInWithPopup(auth, provider);
  const fbUser = result.user;
  const cleanEmail = (fbUser.email || "").trim().toLowerCase();
  const userName = fbUser.displayName || cleanEmail.split("@")[0] || "User";
  const firebaseUid = fbUser.uid;

  if (db && firebaseUid) {
    try {
      const userRef = doc(db, FS_COLLECTIONS.USERS, firebaseUid);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        await setDoc(userRef, {
          id: firebaseUid,
          uid: firebaseUid,
          name: userName,
          email: cleanEmail,
          role: cleanEmail === "zh@gmail.com" ? "ADMIN" : "USER",
          walletBalance: 0.0,
          status: "ACTIVE",
          createdAt: new Date().toISOString(),
        });
      }
    } catch (e) {
      console.warn("Firestore user sync warning:", e);
    }
  }

  // Synchronize session with backend API
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
    throw new Error(data.error || "Google sign-in session creation failed.");
  }

  return data;
}

/**
 * Sign out of Firebase and terminate backend session
 */
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
