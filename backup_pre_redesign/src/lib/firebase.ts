import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Direct hardcoded Firebase credentials to guarantee reliable initialization in all environments
const FIREBASE_CONFIG = {
  projectId: "gen-lang-client-0566149374",
  appId: "1:461470828541:web:ab3835adff18f9f2003b94",
  apiKey: "AIzaSyBmEIP3ZGYd2JczyDNEXYl4IB03djqkrlU",
  authDomain: "gen-lang-client-0566149374.firebaseapp.com",
  storageBucket: "gen-lang-client-0566149374.firebasestorage.app",
  messagingSenderId: "461470828541",
};

const app = getApps().length > 0 ? getApp() : initializeApp(FIREBASE_CONFIG);
const firestoreDbId = "ai-studio-netbybit-876ebbdd-93d6-4799-aae2-351a33e22480";

export const db = firestoreDbId ? getFirestore(app, firestoreDbId) : getFirestore(app);
export const auth = getAuth(app);

// Explicitly enable browser local persistence to keep authentication sessions active across reloads
setPersistence(auth, browserLocalPersistence).catch((err) => {
  console.warn('Firebase Auth persistence notice:', err);
});

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
