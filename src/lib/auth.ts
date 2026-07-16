import { initializeApp, type FirebaseOptions } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  deleteUser,
  getAdditionalUserInfo,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  setPersistence,
  browserLocalPersistence,
  updateProfile,
  type User as FirebaseUser,
} from "firebase/auth";

export const MACHINE_TYPES = [
  "Loom",
  "Spinner",
  "Dyeing Vat",
  "Press",
  "CNC Mill",
  "Lathe",
  "Conveyor",
  "Robotic Arm",
  "Injection Molder",
  "Other",
] as const;

export type MachineType = (typeof MACHINE_TYPES)[number];

export interface User {
  email: string;
  name: string;
  role: "owner" | "supervisor" | "technician";
  machineTypes?: string[];
}

const KEY = "smartpredict_user";

const firebaseConfig: FirebaseOptions = {
  apiKey: "AIzaSyD7FzntMRwXeQPlnGWmerM23Blf_Zq3vYo",
  authDomain: "industry-6be6a.firebaseapp.com",
  projectId: "industry-6be6a",
  storageBucket: "industry-6be6a.firebasestorage.app",
  messagingSenderId: "90102307847",
  appId: "1:90102307847:web:6006cdd0e301a98adedea2",
  measurementId: "G-2CEXDY5C4P",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

googleProvider.addScope("profile");
googleProvider.addScope("email");
googleProvider.setCustomParameters({ prompt: "select_account" });

if (typeof window !== "undefined") {
  void setPersistence(auth, browserLocalPersistence);
}

function mapFirebaseUser(firebaseUser: FirebaseUser | null, role: User["role"] = "owner", fallbackName?: string): User | null {
  if (!firebaseUser) return null;

  return {
    email: firebaseUser.email ?? "",
    name: fallbackName?.trim() || firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "User",
    role,
  };
}

export function setUserRole(role: User["role"]) {
  if (typeof window === "undefined") return;

  const current = getUser();
  if (!current) return;

  const nextUser = { ...current, role };
  persistUser(nextUser);
}

function persistUser(user: User | null) {
  if (typeof window === "undefined") return;

  if (!user) {
    localStorage.removeItem(KEY);
    return;
  }

  localStorage.setItem(KEY, JSON.stringify(user));
}

export function getUser(): User | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function signIn(user: User) {
  persistUser(user);
}

export async function signOut() {
  persistUser(null);
  if (typeof window !== "undefined") {
    await firebaseSignOut(auth);
  }
}

export function isFirebaseAuthAvailable() {
  return typeof window !== "undefined";
}

export function getFirebaseAuth() {
  return auth;
}

export function getGoogleProvider() {
  return googleProvider;
}

function getFriendlyAuthError(error: unknown): Error {
  const message = error instanceof Error ? error.message : String(error);
  const lower = message.toLowerCase();

  if (lower.includes("auth/invalid-credential") || lower.includes("wrong-password")) {
    return new Error(
      "The email or password is incorrect. If you have not registered yet, select Sign up first.",
    );
  }

  if (lower.includes("auth/email-already-in-use")) {
    return new Error("An account with this email already exists.");
  }

  if (lower.includes("auth/weak-password")) {
    return new Error("Please choose a stronger password with at least 6 characters.");
  }

  if (lower.includes("auth/user-not-found")) {
    return new Error("No account was found for this email.");
  }

  if (lower.includes("auth/popup-closed-by-user") || lower.includes("auth/popup-blocked")) {
    return new Error("Google sign-in was cancelled or blocked by the browser.");
  }

  if (lower.includes("auth/operation-not-allowed")) {
    return new Error("Google sign-in is not enabled in Firebase Authentication for this project.");
  }

  if (lower.includes("auth/unauthorized-domain")) {
    return new Error("This domain is not authorized for Google sign-in. Add it under Firebase Authentication > Settings > Authorized domains.");
  }

  if (lower.includes("auth/network-request-failed")) {
    return new Error("Network error. Please check your connection and try again.");
  }

  if (lower.includes("auth/invalid-email")) {
    return new Error("Please enter a valid email address.");
  }

  if (lower.includes("auth/too-many-requests")) {
    return new Error("Too many attempts. Please wait a moment and try again.");
  }

  return new Error(`Authentication failed. ${message}`);
}

export async function signInWithEmail(
  email: string,
  password: string,
  role: User["role"] = "owner",
) {
  if (typeof window === "undefined") throw new Error("Window is not available");

  const normalizedRole = role === "supervisor" ? "supervisor" : "owner";

  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    const user = mapFirebaseUser(result.user, normalizedRole);

    if (!user) throw new Error("No user information returned");

    persistUser(user);
    return user;
  } catch (error) {
    throw getFriendlyAuthError(error);
  }
}

export async function signUpWithEmail(email: string, password: string, name: string, role: User["role"] = "owner") {
  if (typeof window === "undefined") throw new Error("Window is not available");

  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    if (name.trim()) {
      await updateProfile(result.user, { displayName: name.trim() });
    }

    const user = mapFirebaseUser(result.user, role);
    if (!user) throw new Error("No user information returned");

    persistUser(user);
    return user;
  } catch (error) {
    throw getFriendlyAuthError(error);
  }
}

export async function signInWithGoogle(
  mode: "login" | "signup",
  role: User["role"] = "owner",
  displayName?: string,
) {
  if (typeof window === "undefined") return null;

  try {
    const result = await signInWithPopup(auth, googleProvider);
    const isNewUser = getAdditionalUserInfo(result)?.isNewUser === true;

    if (mode === "signup" && !isNewUser) {
      await firebaseSignOut(auth);
      throw new Error("This Google account is already registered. Please select Sign in.");
    }

    if (mode === "login" && isNewUser) {
      await deleteUser(result.user);
      throw new Error("No account exists for this Google address. Please select Sign up first.");
    }

    const user = mapFirebaseUser(result.user, role, displayName);

    if (!user) throw new Error("No user information returned");

    persistUser(user);
    return user;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    if (message.startsWith("This Google account") || message.startsWith("No account exists")) {
      throw new Error(message);
    }

    throw getFriendlyAuthError(error);
  }
}

export async function completeGoogleRedirectSignIn(role: User["role"] = "owner", displayName?: string) {
  if (typeof window === "undefined") return null;

  try {
    const result = await getRedirectResult(auth);
    const user = mapFirebaseUser(result?.user ?? null, role, displayName);

    if (user) {
      persistUser(user);
      return user;
    }

    return null;
  } catch (error) {
    throw getFriendlyAuthError(error);
  }
}

export function observeAuthState(callback: (user: User | null) => void) {
  if (typeof window === "undefined") return () => undefined;
  return onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
    const storedUser = getUser();
    const fallbackName = storedUser?.name || firebaseUser?.displayName || firebaseUser?.email?.split("@")[0] || "User";
    const user = mapFirebaseUser(firebaseUser, storedUser?.role ?? "owner", fallbackName);
    persistUser(user);
    callback(user);
  });
}
