import httpUtility from "./http.js";
import jwt from "jsonwebtoken";

function resolveJWTSecret(aReS, secretOverride) {
  if (!aReS) {
    throw new TypeError("aReS instance is required");
  }

  const configSecret = aReS.getConfig?.("jwt.secret")
    ?? aReS.getConfig?.("jwtSecret")
    ?? aReS.getConfig?.("jwt")?.secret
    ?? aReS.appSetup?.jwtSecret;

  const secret = secretOverride ?? configSecret ?? process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT secret not configured");
  }
  return secret;
}

export async function validateJWT(aReS, req, res, validateFunction = null) {
  let token = req.token;
  if (!token) {
    try{
      extractToken(req);
      token = req.token;
      if (!token) {
        httpUtility.sendError401(req, res, "JWT Token not provided");
        return false;
      }
    }catch(e) {
      httpUtility.sendError401(req, res, e.message);
      return false;
    }
  }

  try {
    const notValidCallback = (message)=> httpUtility.sendError401(req, res, "Session not valid"+(message?': '+message:''));
    if (!validateFunction) {
      const decoded = jwt.verify(token, resolveJWTSecret(aReS));
      if (decoded && typeof decoded === "object") {
        if ("userId" in decoded && decoded.userId) req.userId = decoded.userId;
        else if ("sub" in decoded && decoded.sub) req.userId = decoded.sub;
        if ("sessionId" in decoded && decoded.sessionId) req.sessionId = decoded.sessionId;
        else if ("sessionID" in decoded && decoded.sessionID) req.sessionId = decoded.sessionID;
        else if ("sid" in decoded && decoded.sid) req.sessionId = decoded.sid;
      }

      const serverSessionId = req.sessionID ?? req.sessionId;
      if (req.sessionId && serverSessionId && req.sessionId !== serverSessionId) {
        notValidCallback("Session mismatch");
        return false;
      }
      if (req.session && req.userId && !req.session.userId) {
        req.session.userId = req.userId;
      }
      return true
    }

    const result = validateFunction(token, notValidCallback, req, res, aReS);
    return result instanceof Promise ? Boolean(await result) : Boolean(result);
  } catch (error) {
    httpUtility.sendError401(req, res, "JWT Token not valid");
    return false;
  }
}

export function generateJWT(aReS, userId, sessionId, secretOverride = undefined) {
  const secret = resolveJWTSecret(aReS, secretOverride);
  const payload = {
    userId: userId,
    sessionId: sessionId,
  };

  const token = jwt.sign(payload, secret);
  return token;
}

export function extractToken(req) {
  const authHeader = req.headers["authorization"];
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    req.token = token;
  }
}
