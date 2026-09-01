/**
 * @author Roberto Stefani
 * @license MIT
 */
import express from "express";
import expressSession from "express-session";
import cors from "cors";
import crypto from "crypto";
import { asyncConsole } from "@ares/core/console.js";
import permissions from "./permissions.js";
import httpUtility from "./http.js";
import * as datasources from "./datasources.js";
import * as jwt from "./jwt.js";

const ROUTE_REGISTRY_KEY = Symbol("aReS.web.routeRegistry");

function resolveHostFromAppSetup(aReS, fallbackHost = "127.0.0.1") {
  const environments = Array.isArray(aReS?.appSetup?.environments) ? aReS.appSetup.environments : [];
  const currentEnv = String(aReS?.appSetup?.environment ?? aReS?.appSetup?.env ?? "").trim().toLowerCase();

  const candidate =
    environments.find((env) => String(env?.type ?? "").trim().toLowerCase() === currentEnv) ??
    environments.find((env) => String(env?.type ?? "").trim().toLowerCase() === "production") ??
    null;

  const source = candidate?.domain ?? candidate?.host ?? candidate?.url ?? candidate?.baseUrl;
  if (!source) return fallbackHost;

  const raw = String(source).trim();
  if (!raw) return fallbackHost;

  try {
    const url = raw.includes("://") ? raw : `http://${raw}`;
    const parsed = new URL(url);
    return parsed.hostname || fallbackHost;
  } catch {
    return raw.split("/")[0].split(":")[0] || fallbackHost;
  }
}

/**
 * Logga l'access point base del server web (dominio + porta).
 * Utile come utility cross-progetto per sapere dove sta ascoltando l'istanza aReS.
 */
export function logWebServerAccessPoint(aReS, overrides = {}) {
  const port = Number(overrides.port ?? aReS?.appSetup?.webServerPort ?? 3000);
  const host = String(overrides.host ?? resolveHostFromAppSetup(aReS));
  const protocol = String(overrides.protocol ?? "http");

  const baseUrl = `${protocol}://${host}:${port}/`;
  asyncConsole.log("web", { message: "Web server access point", host, port, baseUrl });
  return { host, port, baseUrl };
}

function normalizeRoutePath(pathValue) {
  if (typeof pathValue === "string") return pathValue;
  if (pathValue instanceof RegExp) return pathValue.toString();
  return String(pathValue);
}

function normalizeRoutePaths(pathValue) {
  if (Array.isArray(pathValue)) return pathValue.map(normalizeRoutePath);
  return [normalizeRoutePath(pathValue)];
}

function enableRouteRegistry(aReS) {
  const app = aReS?.httpServer;
  if (!app) return;
  if (Array.isArray(app[ROUTE_REGISTRY_KEY])) return;

  const registry = [];
  app[ROUTE_REGISTRY_KEY] = registry;

  const expressMethods = [
    ...new Set(Object.values(httpUtility.httpMethods).map((m) => m.expressMethod).filter(Boolean))
  ];

  for (const method of expressMethods) {
    const original = app[method];
    if (typeof original !== "function") continue;
    if (original.__aresWrapped) continue;

    const wrapped = function (pathValue, ...handlers) {
      const hasHandler = handlers.some((h) => typeof h === "function" || Array.isArray(h));
      if (hasHandler && pathValue !== undefined && pathValue !== null) {
        const paths = normalizeRoutePaths(pathValue);
        for (const path of paths) {
          registry.push({ method: method.toUpperCase(), path });
        }
      }
      return original.call(this, pathValue, ...handlers);
    };
    wrapped.__aresWrapped = true;
    app[method] = wrapped;
  }
}

export function createResponseDiagnosticsMiddleware(aReS, options = {}) {
  const resolveEnabled =
    typeof options.enabled === "function"
      ? options.enabled
      : () =>
          Boolean(
            aReS?.getLoggingConfig?.()?.diagnostics ??
              aReS?.getConfig?.("logging.diagnostics", false)
          );

  const log =
    typeof options.log === "function"
      ? options.log
      : (payload) => asyncConsole.log("web", payload);

  return (req, res, next) => {
    const diagnosticsEnabled = Boolean(resolveEnabled(req, res));
    if (!diagnosticsEnabled) return next();

    const originalSend = res.send;
    res.send = function (...args) {
      log({ message: "Response send called", stack: new Error().stack });
      return originalSend.apply(res, args);
    };

    const originalJson = res.json;
    res.json = function (...args) {
      log({ message: "Response json called", stack: new Error().stack });
      return originalJson.apply(res, args);
    };

    const originalSetHeader = res.setHeader;
    res.setHeader = function (name, value) {
      log({ message: "Setting header", name, value, stack: new Error().stack });
      return originalSetHeader.apply(res, [name, value]);
    };

    next();
  };
}

export function createSessionIdentityMiddleware(options = {}) {
  const headerName = String(options.headerName ?? "x-session-id").toLowerCase();

  return (req, res, next) => {
    const headers = req?.headers ?? {};
    const fromHeader = headers[headerName];
    const candidate =
      req?.sessionId ??
      req?.sessionID ??
      fromHeader ??
      req?.session?.id;

    if (candidate !== undefined && candidate !== null && `${candidate}`.trim() !== "") {
      const normalized = String(candidate);
      if (!req.sessionId || `${req.sessionId}`.trim() === "") {
        req.sessionId = normalized;
      }
      if (!headers[headerName]) {
        headers[headerName] = normalized;
      }
      req.headers = headers;
    }

    next();
  };
}

export function createCorsMiddleware(aReS, overrides = undefined) {
  const configValue =
    overrides ??
    aReS?.getConfig?.("cors") ??
    aReS?.appSetup?.cors;

  if (!configValue) return null;

  if (configValue === true) {
    return cors();
  }

  if (typeof configValue === "string" || Array.isArray(configValue)) {
    return cors({ origin: configValue });
  }

  if (typeof configValue === "object") {
    const enabled = configValue.enabled;
    if (enabled === false) return null;
    if (enabled === true && configValue.options && typeof configValue.options === "object") {
      return cors(configValue.options);
    }
    return cors(configValue);
  }

  return null;
}

export function createJsonBodyParserMiddleware(aReS, overrides = undefined) {
  const configValue =
    overrides ??
    aReS?.getConfig?.("express.json") ??
    aReS?.getConfig?.("expressJson") ??
    aReS?.appSetup?.expressJson ??
    aReS?.appSetup?.json;

  if (configValue === false || configValue === null) return null;
  if (configValue === true || configValue === undefined) return express.json();
  if (typeof configValue === "object") return express.json(configValue);
  return express.json();
}

export function createSessionMiddleware(aReS, overrides = undefined) {
  const configValue =
    overrides ??
    aReS?.getConfig?.("session") ??
    aReS?.appSetup?.session;

  if (configValue === false || configValue === null) return null;

  const sessionOptions =
    configValue === true || configValue === undefined
      ? {}
      : typeof configValue === "object"
        ? { ...configValue }
        : {};

  const isProductionRuntime = Boolean(aReS?.isProduction ?? aReS?.appSetup?.isProduction);

  const secret =
    sessionOptions.secret ??
    aReS?.getConfig?.("session.secret") ??
    process.env.SESSION_SECRET;

  sessionOptions.secret =
    secret && `${secret}`.trim() !== ""
      ? String(secret)
      : crypto.randomBytes(48).toString("base64url");

  if (sessionOptions.resave === undefined) sessionOptions.resave = false;
  if (sessionOptions.saveUninitialized === undefined) sessionOptions.saveUninitialized = false;

  const cookie =
    sessionOptions.cookie && typeof sessionOptions.cookie === "object"
      ? { ...sessionOptions.cookie }
      : {};

  if (cookie.httpOnly === undefined) cookie.httpOnly = true;
  if (cookie.secure === undefined) cookie.secure = isProductionRuntime;
  if (cookie.sameSite === undefined) cookie.sameSite = cookie.secure ? "none" : "lax";

  sessionOptions.cookie = cookie;

  return expressSession(sessionOptions);
}

/**
 * 
 * @returns {Array}
 * 
 * Get all routes
 * 
 */
export function getRoutes(aReS) {
  const registry = aReS?.httpServer?.[ROUTE_REGISTRY_KEY];
  if (Array.isArray(registry)) return [...registry];

  const stack = aReS?.httpServer?._router?.stack;
  if (!Array.isArray(stack)) return [];

  return stack
    .filter((r) => r?.route)
    .map((r) => ({
      method: Object.keys(r.route.methods)[0]?.toUpperCase?.() ?? "GET",
      path: normalizeRoutePath(r.route.path),
    }));
}

export function exportRESTRoute(aReS, id, mapper, callback) {
  if (!aReS?.httpServer) {
    throw new Error("HTTP server not initialized");
  }
  if (!mapper?.path) return;
  if (typeof callback !== "function") {
    throw new TypeError("callback must be a function");
  }

  Object.entries(httpUtility.httpMethods).forEach(([httpMethodKey, httpMethod]) => {
    const method = httpMethodKey?.toUpperCase();
    const methods = new RegExp(mapper?.methods ?? "GET", "i");
    if (method.match(methods)) {
      aReS.httpServer[httpMethod.expressMethod](
        mapper.path,
        async (req, res) => {
          try {
            if (mapper.isJWTSensible) {
              aReS.extractToken(req, res);
              if (!(await aReS.validateJWT(req, res))) return;
            }
            if (aReS.isResourceAllowed(id, req, 0)) {
              asyncConsole.log("web", `Permission check: ${(req.sessionID ?? req.sessionId ?? req.session?.id) ?? "unknown"} can view ${id}`);
              asyncConsole.log("web", `Called aReS REST route: ${mapper.path}`);
              await callback(req, res);
            } else {
              httpUtility.sendError403(req, res, "Permission denied");
            }
          } catch (e) {
            asyncConsole.log("web", { message: `Error executing REST route ${mapper.path}`, error: e });
            httpUtility.sendError500(req, res, e);
          }
        }
      );
    }
  });
}

export async function aReSInitialize(aReS){
  permissions(aReS);
  aReS.getRoutes = () => getRoutes(aReS);
  aReS.extractToken = (req, res) => {
    jwt.extractToken(req);
  };
  aReS.validateJWT = (req, res, validateFunction) =>
    jwt.validateJWT(aReS, req, res, validateFunction);
  const datasourceList = aReS.appSetup?.webDatasources ?? [];
  const port =aReS.appSetup?.webServerPort ??  3000
  

  aReS.httpServer = express();
  enableRouteRegistry(aReS);
  const jsonParser = createJsonBodyParserMiddleware(aReS);
  if (jsonParser) {
    aReS.httpServer.use(jsonParser);
  }
  const corsMiddleware = createCorsMiddleware(aReS);
  if (corsMiddleware) {
    aReS.httpServer.use(corsMiddleware);
  }
  aReS.httpServer.use((req, res, next) => {
    req.aReS = aReS;
    next();
  });

  aReS.exportRESTRoute = (id, mapper, callback) => exportRESTRoute(aReS, id, mapper, callback);

  const middlewares = [];
  const sessionMiddleware = createSessionMiddleware(aReS);
  if (sessionMiddleware) {
    middlewares.push(sessionMiddleware);
  }
  middlewares.push(createSessionIdentityMiddleware());

  if(aReS.appSetup?.overrideResponse){
    middlewares.push(createResponseDiagnosticsMiddleware(aReS));
  }

  aReS.httpServer.use(
    ...middlewares
  );

  aReS.httpServer.get("/", (req, res) => {
    if (aReS.pages?.index) res.redirect(aReS.pages.index);
    else
      res.json({
        application: aReS.appSetup.name,
        env: aReS.appSetup.environment,
        url: req.url,
        routes: aReS.getRoutes(),
      });
  });

  const defaultDatasourceAutoExport = datasourceList.length > 0;
  const configuredDatasourceAutoExport =
    aReS.getConfig?.("web.datasources.autoExport") ??
    aReS.getConfig?.("datasources.autoExport") ??
    aReS.appSetup?.webDatasourcesAutoExport;
  const datasourceAutoExport =
    typeof configuredDatasourceAutoExport === "boolean"
      ? configuredDatasourceAutoExport
      : defaultDatasourceAutoExport;

  aReS.initWebDatasources = async (list) => {
    const ret =[];
    for (const ds of list) {
      const perDatasourceAutoExport =
        typeof ds?.autoExport === "boolean" ? ds.autoExport : datasourceAutoExport;
      const onMapperLoaded = perDatasourceAutoExport
        ? datasources.exportDatasourceQueryAsRESTService
        : null;

      const datasource = await datasources.loadDatasource(aReS, ds, onMapperLoaded, true);
      if (datasource.restRouter && Array.isArray(datasource.restRouter)) {
        datasource.restRouter.forEach((r) => r(aReS.httpServer));
        ret.push({name:datasource.name, done:true});
      }
      else ret.push({name:datasource.name, done:perDatasourceAutoExport});
    }
    asyncConsole.output("datasources");
    return ret;
  };

  await aReS.initWebDatasources(datasourceList);

  aReS.httpServer.listen(port, () => {
    console.log(`🚀 Web Server running at http://localhost:${port}/`);
  });
}
 

/**
 *
 * @param {string} url
 * @returns {boolean}
 *
 * Check if url corresponds to production environment
 *
 * */
export function isProduction(aReS,url) {
  const fallback = Boolean(aReS?.isProduction ?? aReS?.appSetup?.isProduction);
  const environments = Array.isArray(aReS?.appSetup?.environments) ? aReS.appSetup.environments : [];
  if (!url || environments.length === 0) return fallback;

  const resolveCandidate = (value) => {
    if (!value) return [];
    const raw = String(value).trim().toLowerCase();
    if (!raw) return [];
    const ensureUrl = raw.includes("://") ? raw : `http://${raw}`;
    try {
      const parsed = new URL(ensureUrl);
      const host = parsed.host.toLowerCase();
      const hostNoPort = parsed.hostname.toLowerCase();
      return host === hostNoPort ? [host] : [host, hostNoPort];
    } catch {
      const withoutPath = raw.split("/")[0];
      const host = withoutPath;
      const hostNoPort = withoutPath.split(":")[0];
      return host === hostNoPort ? [host] : [host, hostNoPort];
    }
  };

  const inputSource =
    typeof url === "string"
      ? url
      : url?.headers?.host ?? url?.hostname ?? url?.host ?? url?.url ?? "";

  const inputCandidates = resolveCandidate(inputSource);
  if (inputCandidates.length === 0) return fallback;

  const matched = environments.some((env) => {
    const type = String(env?.type ?? "").trim().toLowerCase();
    const isProd = type === "production" || type === "prod";
    if (!isProd) return false;

    const domainSource = env?.domain ?? env?.url ?? env?.host ?? env?.baseUrl;
    const domainCandidates = resolveCandidate(domainSource);
    if (domainCandidates.length === 0) return false;

    return inputCandidates.some((input) =>
      domainCandidates.some((domain) => input === domain || input.endsWith(`.${domain}`))
    );
  });

  return matched || fallback;
}






