import httpUtility from "./http.js";


export default function aReSInitialize(aReS){
  aReS.isResourceAllowed = (id, req, stopMode=2) => isResourceAllowed(aReS, id, req, stopMode);
  aReS.getPermission = (host, userId, userAgent, method=null) => getPermission(aReS, host, userId, userAgent, method);
}

function toArray(value) {
  if (Array.isArray(value)) return value.filter((item) => item !== undefined && item !== null);
  if (value === undefined || value === null) return [];
  return [value];
}

function normalizeUserId(userId = null) {
  return typeof userId === "string" && /^\w+$/.test(userId) ? userId : "*";
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function matchesPattern(pattern, value) {
  const normalizedPattern = String(pattern ?? "").trim();
  const normalizedValue = String(value ?? "");
  if (!normalizedPattern || normalizedPattern === "*") return true;
  if (!normalizedPattern.includes("*")) {
    return normalizedPattern.toLowerCase() === normalizedValue.toLowerCase();
  }
  const regexPattern = `^${escapeRegex(normalizedPattern).replace(/\\\*/g, ".*")}$`;
  return new RegExp(regexPattern, "i").test(normalizedValue);
}

function matchesAny(patterns, value) {
  if (patterns.length === 0) return true;
  return patterns.some((pattern) => matchesPattern(pattern, value));
}

function normalizeMethod(method) {
  const normalized = typeof method === "string" ? method.trim().toUpperCase() : "";
  return normalized || null;
}

function getPermissionsSource(aReS) {
  const fromPolicy = aReS?.getPolicy?.("permissions");
  if (Array.isArray(fromPolicy)) return fromPolicy;
  const legacy = aReS?.appSetup?.permissions;
  return Array.isArray(legacy) ? legacy : [];
}

function matchesResource(permission, resourceId) {
  const resources = toArray(permission.allowedResource ?? permission.resources);
  if (resources.length === 0) return true;
  return resources.some((resource) => matchesPattern(resource, resourceId));
}

function matchesMethod(permission, method) {
  const normalizedMethod = normalizeMethod(method);
  const methods = toArray(permission.methods).map((entry) => String(entry).toUpperCase());
  if (methods.length === 0 || !normalizedMethod) return true;
  if (methods.includes("ALL") || methods.includes("*")) return true;
  return methods.includes(normalizedMethod);
}

/**
 * Check if the resource is allowed based on the provided parameters.
 * 
 * @param {aReS} aReS - The aReS instance
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
  aReS,
  id,
  req,
  stopMode=2
) {
  const resourceId = String(id ?? "").toLowerCase();
  const host = req?.ip ?? req?.host ?? req?.hostname ?? req?.headers?.host ?? null;
  const userId = req?.userId ?? req?.sessionId ?? req?.sessionID ?? req?.session?.id ?? null;
  const userAgent = req?.headers?.["user-agent"] ?? req?.userAgent ?? "*";
  const method = req?.method ?? req?.httpMethod ?? null;

  const filteredPermissions = getPermission(aReS, host, userId, userAgent, method).filter(
    (permission) => matchesResource(permission, resourceId)
  );

  if(stopMode===0) return filteredPermissions.length > 0;
  if(stopMode===1 && filteredPermissions.length === 0) throw new Error("Permission denied");
  if(stopMode===2 && filteredPermissions.length === 0) permissionFail(resourceId, req);
  return filteredPermissions.length > 0;
}

/**
 * Function to get filtered permissions based on host, userId, and userAgent.
 * 
 * @param {aReS} aReS - The aReS instance
 * @param {string} host - The host for which permissions are being filtered
 * @param {string} userId - The user ID for which permissions are being filtered
 * @param {string} userAgent - The user agent for which permissions are being filtered
 * @return {array} The filtered permissions based on the provided parameters
 */
export function getPermission(aReS, host, userId, userAgent, method=null) {
  const permissions = getPermissionsSource(aReS);
  const normalizedUserId = normalizeUserId(userId);
  const normalizedUserAgent = userAgent ? String(userAgent) : "";
  const normalizedHost = host === undefined || host === null ? null : String(host);
  const normalizedMethod = normalizeMethod(method);

  return permissions.filter((permission) => {
    const hosts = toArray(permission.hosts);
    const userAgents = toArray(permission.userAgents);
    const allowOnlyForUserId = toArray(
      permission.allowOnlyForUserId ??
        permission.allowOnlyForUserIds ??
        permission.allowForUserId ??
        permission.allowForUserIds
    )
      .map((entry) => String(entry).trim())
      .filter(Boolean);
    const denyForUserId = toArray(
      permission.dontAllowOnlyForUserId ??
        permission.dontAllowOnlyForUserIds ??
        permission.dontAllowForUserId ??
        permission.dontAllowForUserIds ??
        permission.denyForUserId ??
        permission.denyForUserIds ??
        permission.denyOnlyForUserId ??
        permission.denyOnlyForUserIds
    )
      .map((entry) => String(entry).trim())
      .filter(Boolean);

    const hostAllowed =
      hosts.length === 0 || normalizedHost === null
        ? true
        : matchesAny(hosts, normalizedHost);

    const userAgentAllowed =
      userAgents.length === 0
        ? true
        : matchesAny(userAgents, normalizedUserAgent);

    const userAllowed =
      allowOnlyForUserId.length === 0
        ? true
        : allowOnlyForUserId.includes(normalizedUserId);

    const userDenied = denyForUserId.includes(normalizedUserId);

    return hostAllowed && userAgentAllowed && userAllowed && !userDenied && matchesMethod(permission, normalizedMethod);
  });
}

/**
* function to handle permission failure by sending an error response with a 403 status code and a message "Permission denied".
* 
* @param {type} id - The ID parameter for the function
* @param {type} req - The request object
* @return {type} No explicit return value
*/
export function permissionFail(id,req) {
  if (req?.res) {
    httpUtility.sendError403(req, req.res, "Permission denied");
    return;
  }
  throw new Error(`Permission denied for resource "${id}"`);
}

