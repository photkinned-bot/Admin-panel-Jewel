import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signOut,
  User 
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

export const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.file'
];

const provider = new GoogleAuthProvider();
SCOPES.forEach(scope => {
  provider.addScope(scope);
});
provider.setCustomParameters({
  prompt: 'select_account'
});

let isSigningIn = false;
let cachedAccessToken: string | null = null;
let cachedUser: User | null = null;

// Auth state listeners
type AuthListener = (user: User | null, token: string | null) => void;
const listeners: Set<AuthListener> = new Set();

export const subscribeAuth = (listener: AuthListener) => {
  listeners.add(listener);
  // Immediate call with current state
  listener(cachedUser, cachedAccessToken);
  return () => {
    listeners.delete(listener);
  };
};

const notifyListeners = () => {
  listeners.forEach(listener => listener(cachedUser, cachedAccessToken));
};

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  // Check for redirect result on app load
  getRedirectResult(auth)
    .then((result) => {
      if (result) {
        const credential = GoogleAuthProvider.credentialFromResult(result);
        if (credential?.accessToken) {
          cachedAccessToken = credential.accessToken;
          cachedUser = result.user;
          notifyListeners();
          if (onAuthSuccess) onAuthSuccess(result.user, credential.accessToken);
        }
      }
    })
    .catch((err) => {
      console.warn('getRedirectResult warning:', err);
    });

  return onAuthStateChanged(auth, async (user: User | null) => {
    cachedUser = user;
    if (user) {
      if (cachedAccessToken) {
        notifyListeners();
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        // Token is not in memory; user is signed in to firebase but needs fresh token from interaction
        notifyListeners();
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      cachedUser = null;
      notifyListeners();
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const isInsideIframe = (): boolean => {
  try {
    return typeof window !== 'undefined' && window.self !== window.top;
  } catch (e) {
    return true;
  }
};

export const formatAuthErrorMessage = (error: any): string => {
  if (!error) return 'Невідома помилка авторизації';
  
  if (error.code === 'auth/popup-blocked' || error.message?.includes('popup-blocked')) {
    return 'Браузер заблокував спливаюче вікно для входу через вбудований перегляд. Відкрийте застосунок в окремій вкладці для швидкого входу.';
  }
  if (error.code === 'auth/popup-closed-by-user') {
    return 'Авторизацію скасовано (вікно входу закрито).';
  }
  if (error.code === 'auth/cancelled-popup-request') {
    return 'Попередній запит авторизації було скасовано.';
  }
  if (error.code === 'auth/unauthorized-domain') {
    return 'Поточний домен не додано до списку авторизованих доменів у Firebase Console.';
  }
  if (error.code === 'auth/network-request-failed') {
    return 'Помилка мережі при з\'єднанні з серверами Google.';
  }
  
  return error.message || 'Помилка авторизації Google';
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Не вдалося отримати токен доступу Google OAuth');
    }

    cachedAccessToken = credential.accessToken;
    cachedUser = result.user;
    notifyListeners();
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.warn('Google sign in note:', error?.code || error?.message);
    const friendlyMessage = formatAuthErrorMessage(error);
    const customErr = new Error(friendlyMessage);
    (customErr as any).code = error?.code || 'AUTH_ERROR';
    (customErr as any).originalError = error;
    throw customErr;
  } finally {
    isSigningIn = false;
  }
};

export const googleSignInRedirect = async (): Promise<void> => {
  try {
    isSigningIn = true;
    await signInWithRedirect(auth, provider);
  } catch (error: any) {
    console.error('Redirect sign-in error:', error);
    throw new Error(formatAuthErrorMessage(error));
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const getCurrentUser = (): User | null => {
  return cachedUser || auth.currentUser;
};

export const googleLogout = async () => {
  await signOut(auth);
  cachedAccessToken = null;
  cachedUser = null;
  notifyListeners();
};

