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
import * as datasources from "./datasources.js";
import { asyncConsole } from "@ares/core/console.js";
import * as jwt from "./jwt.js";

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
aReS.extractToken = (req, res) => {
  jwt.extractToken(req);
};

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

  aReS.exportRESTRoute = (id, mapper, callback) => {
    if (mapper.path) {
      for (let method in httpUtility.httpMethods) {
        method = method?.toUpperCase() ;
        const methods = new RegExp(mapper?.methods ?? "GET" , "i");
        if (method.match(methods)) {
          aReS.server[httpUtility.httpMethods[method].expressMethod](
            mapper.path,
            async (req, res) => {
              if (
                mapper.isJWTSensible  
              ) {
                aReS.extractToken(req, res);
                if(! (await aReS.validateJWT(req, res)))return;
              }
              // req.parameters = httpUtility.getAllParamsByMethod(req);
              if (aReS.permissions.isResourceAllowed(id, req)) {

                if (aReS.isProduction()){
                  console.log('Permission check: ',req.session.id+' can view '+id);
                  console.log('Called aReS REST route: ' + mapper.path);
                  console.log('Request: ' +  req);
                }
                await callback(req, res);
              }
            }
          );
        }
      }
    }
  };

  const overrideResponse = (req, res, next) => {
    const originalSend = res.send;
  
    res.send = function (...args) {
      console.info('--- Response send called ---');
      console.info(new Error().stack); 
      return originalSend.apply(res, args); 
    };
  
    const originalJson = res.json;
  
    res.json = function (...args) {
      console.info('--- Response json called ---');
      console.info(new Error().stack);
      return originalJson.apply(res, args);
    };

    const originalSetHeader = res.setHeader;

    res.setHeader = function (name, value) {
      console.info(`--- Setting header: ${name} = ${value} ---`);
      console.info(new Error().stack);
      return originalSetHeader.apply(res, [name, value]);
    };

  
    next();
  };

  const middlewares = [
    expressSession( aReS.appSetup.session),
    
  ];

  if(aReS.overrideResponse){
    middlewares.push(overrideResponse);
  }

  aReS.server.use(
    ...middlewares
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
