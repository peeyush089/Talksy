import { useAuthStore } from "./store/useAuthStore";
import { useThemeStore } from "./store/useThemeStore";
import { useEffect, useRef } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import HomePage from "./pages/HomePage";
import SignUpPage from "./pages/SignUpPage";
import LoginPage from "./pages/LoginPage";
import SettingsPage from "./pages/SettingsPage";
import ProfilePage from "./pages/ProfilePage";
import FriendsPage from "./pages/FriendsPage";

import { Loader } from "lucide-react";
import { Toaster, toast } from "react-hot-toast";
import Navbar from "./components/Navbar";

import { ZegoUIKitPrebuilt } from "@zegocloud/zego-uikit-prebuilt";
import { ZIM } from "zego-zim-web";

const APP_ID = 2066757958;
const SERVER_SECRET = "8220352f2600c0028bf0fa4c8f93e8f1";

export let zpGlobal = null;

const App = () => {
  const { authUser, checkAuth, isCheckingAuth } = useAuthStore();
  const { theme } = useThemeStore();
  const zpInitialized = useRef(false);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!authUser || zpInitialized.current) return;

    // ✅ SAFETY CHECK
    if (!authUser._id || !authUser.fullName) {
      console.log("User data not ready:", authUser);
      return;
    }

    try {
      const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
        APP_ID,
        SERVER_SECRET,
        "lobby_" + authUser._id,
        String(authUser._id), // ✅ IMPORTANT
        authUser.fullName
      );

      const zp = ZegoUIKitPrebuilt.create(kitToken);

      if (!zp) {
        console.error("Zego initialization failed");
        return;
      }

      zp.addPlugins({ ZIM });
      zpGlobal = zp;
      zpInitialized.current = true;

      zp.setCallInvitationConfig({
        onOutgoingCallRejected: (callID, callee) => {
          toast.error(`${callee?.userName || "User"} rejected the call`);
        },
        onOutgoingCallTimeout: () => {
          toast("User not answering");
        },
      });

    } catch (err) {
      console.error("Zego Error:", err);
    }

    return () => {
      zpGlobal = null;
      zpInitialized.current = false;
    };
  }, [authUser]);

  if (isCheckingAuth && !authUser)
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader className="size-10 animate-spin" />
      </div>
    );

  return (
    <div data-theme={theme}>
      <Navbar />
      <Routes>
        <Route path="/" element={authUser ? <HomePage /> : <Navigate to="/login" />} />
        <Route path="/signup" element={!authUser ? <SignUpPage /> : <Navigate to="/" />} />
        <Route path="/login" element={!authUser ? <LoginPage /> : <Navigate to="/" />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/profile" element={authUser ? <ProfilePage /> : <Navigate to="/login" />} />
        <Route path="/friends" element={authUser ? <FriendsPage /> : <Navigate to="/login" />} />
      </Routes>
      <Toaster />
    </div>
  );
};

export default App;