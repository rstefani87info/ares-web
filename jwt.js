import appSetup from '../../../app.js';
import httpUtility from './http.js';

export function validateJWT (aReS,req, res){
    const token = req.headers['authorization'];
    if (!token) {
        return httpUtility.sendError401(req,res,'JWT Token not provided');
    }

    try {
        const decoded = jwt.verify(token, appSetup.jwtSecret);
        req.userId = decoded.userId;
        req.sessionId = decoded.sessionId;
        const sessionData = req.session[sessionId];
        if (!sessionData) {
            return httpUtility.sendError401(req,res,'Session not valid');
        }
        req.session[req.sessionId] = sessionData;
    } catch (error) {
        return httpUtility.sendError401(req,res,'JWT Token not valid');
    }
}

export function generateJWT(userId, sessionId) {
    const payload = {
      userId: userId,
      sessionId: sessionId
    };
  
    const secret = appSetup.jwtSecret;
    const token = jwt.sign(payload, secret);
    return token;
}

const jwt = {
    generateJWT: generateJWT,
    jwtBaseMiddleware: validateJWT
};

export default jwt;