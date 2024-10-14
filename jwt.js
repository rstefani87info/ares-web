import appSetup from "../../../app.js";
import httpUtility from "./http.js";

export async function validateJWT( req, res, validateFunction) {
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
      const decoded = jwt.verify(token, appSetup.jwtSecret);
      req.userId = decoded.userId;
      req.sessionId = decoded.sessionId;
      const sessionData = req.session[sessionId];
      if (!sessionData) {
        notValidCallback('');
        return false;
      }
      req.session[req.sessionId] = sessionData;
      return true
    } else return validateFunction(token, notValidCallback);
  } catch (error) {
    httpUtility.sendError401(req, res, "JWT Token not valid");
    return false;
  }
}

export function generateJWT(userId, sessionId) {
  const payload = {
    userId: userId,
    sessionId: sessionId,
  };

  const secret = appSetup.jwtSecret;
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

