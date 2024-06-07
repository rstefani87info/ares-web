/**
 * @author Roberto Stefani
 * @license MIT
 */
import express from "express";
import expressSession from "express-session";
import cors from "cors";
import aReS from "@ares/core";
import * as permissions from "./permissions.js";
import appSetup from '../../../app.js';
import httpUtility from './http.js';
import jwt from './jwt.js';
import datasources from "@ares/web/datasources.js";

/**
 * 
 * @returns {Array}
 * 
 * @desc {en} Get all routes
 * @desc {it} Ottieni tutte le rotte
 * @desc {es} Obtiene todas las rutas


 * @desc {pt} Obtenha todas as rotas


 * 
 */
export function getRoutes() {
  const routes = aReS.server._router.stack
  .filter((r) => r.route)
  .map((r) => ({
    method: Object.keys(r.route.methods)[0].toUpperCase(),
    path: r.route.path
  }));
  return routes;
}
aReS.getRoutes=getRoutes;

/**
 * 
 * @returns {Object}
 * 
 * @desc {en} Initialize web express with all routes
 * @desc {it} Inizializza web express con tutte le rotte
 * @desc {es} Inicializa web express con todas las rutas


 * @desc {pt} Inicializa web express com todas as rotas


 */
async function aReSWebInit (port=3000) {
  aReS.port=port;
  aReS.permissions=permissions;
  aReS.appSetup = appSetup;
  aReS.permissionData = aReS.files.getFileContent("./permissionData.json");
  
  aReS.server = express();
  aReS.server.use(express.json());
  aReS.server.use(cors());
  aReS.jwtSensibleRoots = [];
  

  aReS.exportRoute = ( id, mapper, callback)=>{
    if (mapper.path) {
      if(mapper.isJWTSensible){
        aReS.jwtSensibleRoots.push(mapper);
      }
      for (let method in httpUtility.httpMethods) {
        method = method.toUpperCase();
        const methods = new RegExp(mapper.methods, 'i');
        if (method.match(methods)) {
          aReS.server[httpUtility.httpMethods[method].expressMethod](mapper.path,
            (req, res) => {
              if(mapper.isJWTSensible &&aReS.jwtSensibleRoots.some(m=> m.path === req.url && req.method.match(new RegExp(m.methods, 'i')))){
                jwt.validateJWT(aReS,req, res);
              }
              req.parameters = httpUtility.getAllParamsByMethod(req);
              if (aReS.permissions.isResourceAllowed(id, req )) {
                callback(req, res);
              }
            }
          );
        }
        
      }
    }
  };
  
  aReS.server.use(
    expressSession({
      secret: aReS.crypto.getMD5Hash(aReS.appSetup.name),
      resave: false,
      saveUninitialized: true,
      cookie: aReS.appSetup.cookie
    })
  );

  aReS.server.get('/', (req, res) => {
    if(aReS.pages?.index) res.redirect(aReS.pages.index);
    else res.json({application: appSetup.name, env: appSetup.environment, url: req.url, routes: getRoutes()});
  });
  
  (await datasources.initAllDatasources(aReS,datasources.exportDatasourceQueryAsRESTService,true)).forEach((datasource) => {
    if(datasource.restRouter && Array.isArray(datasource.restRouter))datasource.restRouter.forEach((r) => r(aReS.server));
  });
  
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
 * @desc {en} Check if url corresponds to production environment
 * @desc {it} Verifica se l'url corrisponde alla produzione
 * @desc {es} Comprueba si la url corresponde a la producción
 * @desc {pt} Verifica se l'url corrisponde alla produzione
 * @desc {fr} Vérifier si l'url correspond a l'environnement de production




 *
 * */
export function isProduction(url) {
  return (
    appSetup.environments.some(
      (x) => url.toLowerCase().startsWith(x.domain) && x.type === "production"
    )[0] ?? false
  );
}