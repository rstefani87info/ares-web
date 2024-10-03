 import permissions from "../../../permissionData.js";
 import httpUtility from "./http.js";

/**
 * Check if the resource is allowed based on the provided parameters.
 *
 * @param {string} id - The ID of the resource
 * @param {string} [host=null] - The host of the resource (optional)
 * @param {string} [userId=null] - The user ID (optional)
 * @param {string} [userAgent=null] - The user agent (optional)
 * @param {string} [method='ALL'] - The method for resource access (optional, default is 'ALL')
 * @return {boolean} Whether the resource is allowed
 * 
 * @prototype {string}
 */

export function isResourceAllowed(
  id,
 req,
 stopMode=2
) {
  // const method = req.method ? req.method.toUpperCase() : "ALL";
  id = id.toLowerCase();
  const host = req.ip;
  const userId = req?.parameters['@userId'] || '';
  const userAgent = req.headers['user-agent'];
  let filteredPermissions = getPermission(host, userId,userAgent);
  if(stopMode===0) return filteredPermissions.length > 0;
  if(stopMode===1 && filteredPermissions.length === 0) throw new Error("Permission denied");
  if(stopMode===2 && filteredPermissions.length === 0) permissionFail(id,req);
  return filteredPermissions.length > 0;
}

/**
 * Function to get filtered permissions based on host, userId, and userAgent.
 * 
 * @param {string} host - The host for which permissions are being filtered
 * @param {string} userId - The user ID for which permissions are being filtered
 * @param {string} userAgent - The user agent for which permissions are being filtered
 * @return {array} The filtered permissions based on the provided parameters
 */
export function getPermission(host, userId, userAgent) {
  userId = (userId ?? "").match(/^\w+$/g) ? userId : "*";
  userAgent = userAgent ? userAgent : "*";
  let filteredPermissions = permissions.filter(
    (x) =>
      (x.hosts && x.hosts.length > 0
        ? x.hosts.indexOf(host + "")+x.hosts.indexOf("*")+1 >= 0
        : true) &&
      (x.userAgents && x.userAgents.length > 0
        ? x.userAgents.filter((y) => userAgent==="*" || y===userAgent || new RegExp(y).test(userAgent) ).length >= 0
        : true) &&
      (x.allowOnlyForUserId && x.allowOnlyForUserId.length > 0
        ? x.allowOnlyForUserId.indexOf(userId + "")  >= 0
        : true) &&
      !(x.dontAllowOnlyForUserId && x.dontAllowOnlyForUserId.length > 0
        ? x.allowOnlyForUserId.indexOf("!" + userId) >= 0
        : false)
  );
  return filteredPermissions;
}

/**
* function to handle permission failure by sending an error response with a 403 status code and a message "Permission denied".
* 
* @param {type} id - The ID parameter for the function
* @param {type} req - The request object
* @return {type} No explicit return value
*/
export function permissionFail(id,req) {
  httpUtility.sendError403(req, req.res, "Permission denied");
}

export default permissions;
