/**
 * @author Roberto Stefani
 * @license MIT
 */
import express from "express";
import expressSession from "express-session";
import cors from "cors";
import aReS from "@ares/core";
import * as permissions from "./permissions.js";
import httpUtility from "./http.js";
// import jwt from "./jwt.js";
import * as datasources from "./datasources.js";
import { asyncConsole } from "@ares/core/console.js";

/**
 * 
 * @returns {Array}
 * 
 * Get all routes
 * 
 */
export function getRoutes() {
  const routes = aReS.server._router.stack
    .filter((r) => r.route)
    .map((r) => ({
      method: Object.keys(r.route.methods)[0].toUpperCase(),
      path: r.route.path,
    }));
  return routes;
}
aReS.getRoutes = getRoutes;

/**
 * @param {number} port
 * @param {array} datasources
 * @returns {Object}
 *
 * Initialize web express with all routes
 */
async function aReSWebInit(port = 3000, datasourceList) {
  aReS.port = port;
  aReS.permissions = permissions;

  aReS.server = express();
  aReS.server.use(express.json());
  aReS.server.use(cors());


  aReS.extractToken = (req, res) => {
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      req.token = token;
    } else {
      res.status(401).json({ message: 'Unauthorized: invalid token' });
    }
  };

  aReS.exportRESTRoute = (id, mapper, callback) => {
    if (mapper.path) {
      for (let method in httpUtility.httpMethods) {
        method = method?.toUpperCase() ;
        const methods = new RegExp(mapper?.methods ?? "GET" , "i");
        if (method.match(methods)) {
          aReS.server[httpUtility.httpMethods[method].expressMethod](
            mapper.path,
            (req, res) => {
              if (
                mapper.isJWTSensible  
              ) {
                aReS.extractToken(req, res);
                aReS.validateJWT(aReS, req, res);
              }
              // req.parameters = httpUtility.getAllParamsByMethod(req);
              if (aReS.permissions.isResourceAllowed(id, req)) {
                if (aReS.appSetup.environment !== "production"){
                  console.log('Called aReS REST route: ' + mapper.path);
                  console.log('Request: ' +  req);
                }
                callback(req, res);
              }
            }
          );
        }
      }
    }
  };

  

  aReS.server.use(
    expressSession( aReS.appSetup.session)
  );

  aReS.server.get("/", (req, res) => {
    if (aReS.pages?.index) res.redirect(aReS.pages.index);
    else
      res.json({
        application: aReS.appSetup.name,
        env: aReS.appSetup.environment,
        url: req.url,
        routes: getRoutes(),
      });
  });

  aReS.initAllDatasources = async (list) => {
    const ret =[];
    for (const ds of list) {
      const datasource = await datasources.loadDatasource(aReS, ds, datasources.exportDatasourceQueryAsRESTService, true);
      if (datasource.restRouter && Array.isArray(datasource.restRouter)) {
        datasource.restRouter.forEach((r) => r(aReS.server));
        ret.push({name:datasource.name, done:true});
      }
      else ret.push({name:datasource.name, done:false});
    }
    asyncConsole.output("datasources");
    return ret;
  };

  aReS.initAllDatasources(datasourceList);

  aReS.server.listen(port, () => {
    console.log("Server running at http://localhost:" + port + "/");
  });
  return aReS;
}
export default aReSWebInit;

/**
 *
 * @param {string} url
 * @returns {boolean|{type:string,domain:string}}
 *
 * Check if url corresponds to production environment
 *
 * */
export function isProduction(url) {
  return aReS.appSetup.environments ?
   (
    aReS.appSetup.environments.some(
      (x) => url.toLowerCase().startsWith(x.domain) && x.type === "production"
    )[0] ?? false
  ) : aReS.isProduction();
}
