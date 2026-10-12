import React, { useState, useEffect } from "react";
import { X, LogIn, UserPlus, LogOut, User as UserIcon, Mail, Lock, ShieldCheck, CheckCircle2, AlertCircle } from "lucide-react";
import { 
  signInWithGoogle, 
  logInWithEmail, 
  registerWithEmail, 
  logOut, 
  continueAsGuest 
} from "../lib/firebase";
import { type User } from "firebase/auth";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onAuthSuccess?: (user: User) => void;
  onSignOut?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onAuthSuccess,
  onSignOut
}) => {
  const [tab, setTab] = useState<"login" | "register" | "profile">(currentUser && !currentUser.isAnonymous ? "profile" : "login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (currentUser && !currentUser.isAnonymous) {
      setTab("profile");
    } else {
      setTab("login");
    }
  }, [currentUser, isOpen]);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const user = await signInWithGoogle();
      setSuccessMsg("Successfully signed in with Google!");
      if (onAuthSuccess) onAuthSuccess(user);
      setTimeout(() => {
        onClose();
        setSuccessMsg(null);
      }, 1000);
    } catch (err: any) {
      console.error("Google sign in failed:", err);
      setErrorMsg(err.message || "Could not sign in with Google. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg("Please provide both email and password.");
      return;
    }
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const user = await logInWithEmail(email, password);
      setSuccessMsg("Welcome back! Progress synced.");
      if (onAuthSuccess) onAuthSuccess(user);
      setTimeout(() => {
        onClose();
        setSuccessMsg(null);
      }, 1000);
    } catch (err: any) {
      console.error("Email login failed:", err);
      if (err.code === "auth/invalid-credential" || err.code === "auth/wrong-password" || err.code === "auth/user-not-found") {
        setErrorMsg("Invalid email or password. Please check your credentials.");
      } else {
        setErrorMsg(err.message || "Failed to sign in. Please verify your email and password.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg("Please fill in all fields.");
      return;
    }
    if (password.length < 6) {
      setErrorMsg("Password must be at least 6 characters.");
      return;
    }
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const user = await registerWithEmail(email, password, name || "C++ Developer");
      setSuccessMsg("Account successfully created! Learning roadmap ready.");
      if (onAuthSuccess) onAuthSuccess(user);
      setTimeout(() => {
        onClose();
        setSuccessMsg(null);
      }, 1000);
    } catch (err: any) {
      console.error("Register failed:", err);
      if (err.code === "auth/email-already-in-use") {
        setErrorMsg("An account with this email already exists. Try signing in instead.");
      } else {
        setErrorMsg(err.message || "Registration failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestContinue = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const user = await continueAsGuest();
      setSuccessMsg("Continuing as Guest. Your progress will be saved in your browser.");
      if (onAuthSuccess) onAuthSuccess(user);
      setTimeout(() => {
        onClose();
        setSuccessMsg(null);
      }, 800);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to continue as guest.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      if (onSignOut) {
        await onSignOut();
      } else {
        await logOut();
      }
      setSuccessMsg("Signed out successfully.");
      setTimeout(() => {
        setTab("login");
        setSuccessMsg(null);
        onClose();
      }, 500);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to sign out.");
    } finally {
      setIsLoading(false);
    }
  };

  const isUserLoggedIn = currentUser && !currentUser.isAnonymous;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden p-6">
        {/* Close Button */}
        <button
          id="close-auth-modal"
          onClick={onClose}
          className="absolute top-4 right-4 p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2.5 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">
              {isUserLoggedIn ? "Account & Cloud Sync" : "Student Authentication"}
            </h3>
            <p className="text-xs text-slate-400">
              {isUserLoggedIn
                ? "Synchronized with Firestore cloud database"
                : "Save your curriculum progress, quiz scores & exam certifications"}
            </p>
          </div>
        </div>

        {/* Feedback Alerts */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-xs text-red-200 flex items-start space-x-2">
            <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-xs text-emerald-200 flex items-start space-x-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* If user is already authenticated */}
        {isUserLoggedIn ? (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                  {currentUser.displayName?.[0] || currentUser.email?.[0]?.toUpperCase() || "C"}
                </div>
                <div className="overflow-hidden">
                  <div className="text-sm font-semibold text-white truncate">
                    {currentUser.displayName || "C++ Systems Student"}
                  </div>
                  <div className="text-xs text-slate-400 truncate">{currentUser.email}</div>
                </div>
              </div>
              <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-xs text-slate-400 font-mono">
                <span>UID:</span>
                <span className="text-slate-300">{currentUser.uid.slice(0, 12)}...</span>
              </div>
            </div>

            <button
              id="auth-signout-btn"
              onClick={handleSignOut}
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-xl bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/30 font-semibold text-sm flex items-center justify-center space-x-2 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span>{isLoading ? "Signing out..." : "Sign Out of Account"}</span>
            </button>
          </div>
        ) : (
          <div>
            {/* Tabs */}
            <div className="flex rounded-xl bg-slate-950 p-1 mb-5 border border-slate-800">
              <button
                type="button"
                id="auth-tab-login"
                onClick={() => { setTab("login"); setErrorMsg(null); }}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center space-x-1.5 ${
                  tab === "login" ? "bg-blue-600 text-white shadow" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <LogIn className="h-3.5 w-3.5" />
                <span>Log In</span>
              </button>
              <button
                type="button"
                id="auth-tab-register"
                onClick={() => { setTab("register"); setErrorMsg(null); }}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center space-x-1.5 ${
                  tab === "register" ? "bg-blue-600 text-white shadow" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <UserPlus className="h-3.5 w-3.5" />
                <span>Sign Up</span>
              </button>
            </div>

            {/* Google Sign In Button */}
            <button
              id="google-signin-btn"
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full mb-4 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-750 text-white border border-slate-700 font-medium text-xs flex items-center justify-center space-x-2.5 transition-colors shadow-sm hover:border-blue-500"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            <div className="relative flex items-center justify-center mb-4">
              <div className="border-t border-slate-800 w-full" />
              <span className="bg-slate-900 px-3 text-[10px] text-slate-500 uppercase tracking-wider">
                Or with email
              </span>
              <div className="border-t border-slate-800 w-full" />
            </div>

            {/* Email Form */}
            <form onSubmit={tab === "login" ? handleEmailLogin : handleEmailRegister} className="space-y-3">
              {tab === "register" && (
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Student / Developer Name</label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                    <input
                      type="text"
                      placeholder="e.g. Linus Torvalds"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs text-slate-400 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <input
                    type="email"
                    required
                    placeholder="you@domain.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <button
                id="auth-submit-btn"
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors shadow-md mt-2 flex items-center justify-center space-x-2"
              >
                <span>{isLoading ? "Authenticating..." : tab === "login" ? "Sign In" : "Create Account"}</span>
              </button>
            </form>

            {/* Guest Option */}
            <div className="mt-4 pt-3 border-t border-slate-800 text-center">
              <button
                type="button"
                id="guest-continue-btn"
                onClick={handleGuestContinue}
                className="text-xs text-slate-400 hover:text-blue-400 transition-colors"
              >
                Continue as Guest (Try without an account)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
