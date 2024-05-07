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
import db from "./db.js";
import { cloneWithMethods } from "@ares/core/objects.js";

/**
 * 
 * @returns {Array}
 * 
 * @desc {en} Get all routes
 * @desc {it} Ottieni tutte le rotte
 * @desc {es} Obtiene todas las rutas
 * @desc {de} Holen Sie alle Routen
 * @desc {ru} Получить все маршруты
 * @desc {pt} Obtenha todas as rotas
 * @desc {zh} 获取所有路由
 * @desc {ja} 全てのルーティングを取得
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
 * @desc {de} Initialisiere web express mit allen Routen
 * @desc {ru} Инициализирует web express с всеми маршрутами
 * @desc {pt} Inicializa web express com todas as rotas
 * @desc {zh} 初始化 web express 以及所有路由
 * @desc {ja} web express を初期化し、全てのルーティングを実行
 */
async function aReSWebInit (port=3000) {
  aReS.port=port;
  aReS.permissions=permissions;
  aReS.appSetup = appSetup;
  aReS.permissionData = aReS.files.getFileContent("./permissionData.json");
  
  aReS.server = express();
  aReS.server.use(express.json());
  aReS.server.use(cors());

  aReS.exportRoute = ( id, mapper, callback)=>{
      if (mapper.path) {
        for (let method in httpUtility.httpMethods) {
          method = method.toUpperCase();
          const methods = new RegExp(mapper.methods, 'i');
          if (method.match(methods)) {
            aReS.server[httpUtility.httpMethods[method].expressMethod](mapper.path,
              (req, res) => {
                req.parameters=httpUtility.getAllParamsByMethod(req);
                if (aReS.permissions.isResourceAllowed(id, req )) {
                  callback(req, res);
                }
              }
            );
          }
          
        }
      }
    };
  
  aReS.server.use((req, res, next) => {
    console.log(`Request URL: ${req.url}`);
    console.log(`Request Method: ${req.method}`);
   
      aReS.isProduction = isProduction(req.headers.host.split(':')[0].toLowerCase()) ;
      if (req.cookies && req.cookies[app.md5Name()]) {
        req.session.regenerate((err) => {
          if (!err) {
            req.session.openingTime = moment().toDate();
            req.session.id = getMD5Hash(
              req.get("user-agent") +
                " " +
                req.parameters["@clientUserId"] +
                moment(req.session.openingTime).format("YYYYMMDDHHmmss")
            );
          }
          next();
        });
      } else {
        next();
      }
    
  });

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
  
  (await db.initAllDB(aReS,db.exportDBQueryAsRESTService,true)).forEach((dbi) => {
    if(dbi.restRouter && Array.isArray(dbi.restRouter))dbi.restRouter.forEach((r) => r(aReS.server));
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
 * @desc {de} Überprüfe, ob die URL zu der Produktionsumgebung passt
 * @desc {ja} プロダクション環境と一致するか確認
 * @desc {zh} 检查 URL 是否与生产环境匹配
 * @desc {ru} Проверьте, соответствует ли URL продуктивной среде
 *
 * */
export function isProduction(url) {
  return (
    appSetup.environments.some(
      (x) => url.toLowerCase().startsWith(x.domain) && x.type === "production"
    )[0] ?? false
  );
}