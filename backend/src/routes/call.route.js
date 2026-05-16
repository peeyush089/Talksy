import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import crypto from "crypto";

const router = express.Router();

// Zegocloud Token04 — exact format:
// "04" + Base64( expire(4) + iv_len(2) + iv + cipher_len(2) + cipher )
function generateToken04(appId, userId, secret, effectiveTimeInSeconds) {
  const expire = Math.floor(Date.now() / 1000) + effectiveTimeInSeconds;
  const nonce = Math.floor(Math.random() * 2147483647);
  const ctime = Math.floor(Date.now() / 1000);

  const plainText = JSON.stringify({
    app_id: appId,
    user_id: userId,
    nonce,
    ctime,
    expire,
    payload: "",
  });

  // AES-128-CBC: key = first 16 bytes of secret
  const key = Buffer.from(secret, "utf8").slice(0, 16);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-128-cbc", key, iv);
  const encrypted = Buffer.concat([
    cipher.update(Buffer.from(plainText, "utf8")),
    cipher.final(),
  ]);

  // Pack: expire(4) + iv_len(2) + iv(16) + cipher_len(2) + cipher
  const buf = Buffer.alloc(4 + 2 + iv.length + 2 + encrypted.length);
  let offset = 0;
  buf.writeUInt32BE(expire, offset);        offset += 4;
  buf.writeUInt16BE(iv.length, offset);     offset += 2;
  iv.copy(buf, offset);                     offset += iv.length;
  buf.writeUInt16BE(encrypted.length, offset); offset += 2;
  encrypted.copy(buf, offset);

  return "04" + buf.toString("base64");
}

// POST /api/call/token
router.post("/token", protectRoute, (req, res) => {
  try {
    const APP_ID = Number(process.env.ZEGOCLOUD_APP_ID);
    const SERVER_SECRET = process.env.ZEGOCLOUD_SERVER_SECRET;

    if (!APP_ID || !SERVER_SECRET) {
      return res.status(500).json({ error: "Zegocloud credentials not configured" });
    }
    if (SERVER_SECRET.length !== 32) {
      return res.status(500).json({ error: `Server secret must be 32 chars, got ${SERVER_SECRET.length}` });
    }

    const { roomID } = req.body;
    if (!roomID) return res.status(400).json({ error: "roomID is required" });

    const userID = req.user._id.toString();
    const token = generateToken04(APP_ID, userID, SERVER_SECRET, 3600);

    res.json({ token, appID: APP_ID, userID, userName: req.user.fullName });
  } catch (err) {
    console.error("Call token error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;