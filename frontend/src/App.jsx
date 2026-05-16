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
const SERVER_SECRET = "8220352f2600c0028bf0fa4c8f93e8f1"; // ← your exact Server Secret

export let zpGlobal = null;

const App = () => {
  const { authUser, checkAuth, isCheckingAuth } = useAuthStore();
  const { theme } = useThemeStore();
  const zpInitialized = useRef(false);

  useEffect(() => { checkAuth(); }, [checkAuth]);

  useEffect(() => {
    if (!authUser || zpInitialized.current) return;

    const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
      APP_ID,
      SERVER_SECRET,
      "lobby_" + authUser._id,
      authUser._id,
      authUser.fullName
    );

    const zp = ZegoUIKitPrebuilt.create(kitToken);
    zp.addPlugins({ ZIM });
    zpGlobal = zp;
    zpInitialized.current = true;

    zp.setCallInvitationConfig({
      // Auto-dismiss incoming popup when caller cancels
      onIncomingCallCancelled: (callID, caller) => {
        // Zegocloud handles UI dismiss automatically
      },

      // Auto-dismiss when call ends on either side
      onCallEnd: (callID, reason, duration) => {
        // Zegocloud handles UI dismiss automatically
      },

      // Outgoing — other user busy
      onOutgoingCallRejected: (callID, callee) => {
        if (callee?.reason === "busy") {
          toast.error(
            `${callee?.userName || "User"} is on another call. Try again later.`,
            { icon: "📵", duration: 4000 }
          );
        } else {
          toast(`${callee?.userName || "User"} declined the call.`, { icon: "📵" });
        }
      },

      // Outgoing — no answer
      onOutgoingCallTimeout: (callID, callees) => {
        toast(`No answer from ${callees?.[0]?.userName || "user"}.`, { icon: "⏱️" });
      },

      // Incoming — caller cancelled before we answered
      onIncomingCallTimeout: (callID, caller) => {
        // Zegocloud dismisses the popup automatically
      },
    });

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