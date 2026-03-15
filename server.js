/**
 * @author Roberto Stefani
 * @license MIT
 */
import express from "express";
import expressSession from "express-session";
import cors from "cors";
import { asyncConsole } from "@ares/core/console.js";
import permissions from "./permissions.js";
import httpUtility from "./http.js";
import * as datasources from "./datasources.js";
import * as jwt from "./jwt.js";

/**
 * 
 * @returns {Array}
 * 
 * Get all routes
 * 
 */
export function getRoutes(aReS) {
  const routes = aReS.httpServer._router.stack
    .filter((r) => r.route)
    .map((r) => ({
      method: Object.keys(r.route.methods)[0].toUpperCase(),
      path: r.route.path,
    }));
  return routes;
}

export async function aReSInitialize(aReS){
  permissions(aReS);
  aReS.getRoutes = () => getRoutes(aReS);
  aReS.extractToken = (req, res) => {
    jwt.extractToken(req);
  };
  const datasourceList = aReS.appSetup?.webDatasources ?? [];
  const port =aReS.appSetup?.webServerPort ??  3000
  

  aReS.httpServer = express();
  aReS.httpServer.use(express.json());
  aReS.httpServer.use(cors());

  aReS.exportRESTRoute = (id, mapper, callback) => {
    if (mapper.path) {
      Object.entries(httpUtility.httpMethods).forEach(([httpMethodKey, httpMethod]) => {
        const method = httpMethodKey?.toUpperCase() ;
        const methods = new RegExp(mapper?.methods ?? "GET" , "i");
        if (method.match(methods)) {
          aReS.httpServer[httpMethod.expressMethod](
            mapper.path,
            async (req, res) => {
              try {
                if (
                  mapper.isJWTSensible  
                ) {
                  aReS.extractToken(req, res);
                  if(! (await aReS.validateJWT(req, res)))return;
                }
                if (aReS.isResourceAllowed(id, req, 0)) {
                  if (aReS.isProduction){
                    console.log('Permission check: ',req.session?.id+' can view '+id);
                    console.log('Called aReS REST route: ' + mapper.path);
                    console.log('Request: ' +  req);
                  }
                  await callback(req, res);
                } else {
                  httpUtility.sendError403(req, res, "Permission denied");
                }
              } catch (e) {
                console.error('Error executing REST route ' + mapper.path, e);
                httpUtility.sendError500(req, res, e);
              }
            }
          );
        }
      });
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

  if(aReS.appSetup?.overrideResponse){
    middlewares.push(overrideResponse);
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

  aReS.initWebDatasources = async (list) => {
    const ret =[];
    for (const ds of list) {
      const datasource = await datasources.loadDatasource(aReS, ds, datasources.exportDatasourceQueryAsRESTService, true);
      if (datasource.restRouter && Array.isArray(datasource.restRouter)) {
        datasource.restRouter.forEach((r) => r(aReS.httpServer));
        ret.push({name:datasource.name, done:true});
      }
      else ret.push({name:datasource.name, done:false});
    }
    asyncConsole.output("datasources");
    return ret;
  };

  await aReS.initWebDatasources(datasourceList);

  aReS.httpServer.listen(port, () => {
    console.log("Server running at http://localhost:" + port + "/");
  });
}
 

/**
 *
 * @param {string} url
 * @returns {boolean|{type:string,domain:string}}
 *
 * Check if url corresponds to production environment
 *
 * */
export function isProduction(aReS,url) {
  return aReS.appSetup.environments ?
   (
    aReS.appSetup.environments.some(
      (x) => url.toLowerCase().startsWith(x.domain) && x.type === "production"
    )[0] ?? false
  ) : aReS.isProduction;
}






