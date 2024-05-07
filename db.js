/**
 * @author Roberto Stefani
 * @license MIT
 */
import permissions from '@ares/core/permissions.js';
import dbCore from '@ares/core/db.js';
import { asyncConsole } from '@ares/core/console.js';
import httpUtility from './http.js';
import { uxFilePathRegex } from '@ares/core/regex.js';
export const dbMap = {};

/**
 * @param {Object} mapper - The request mapper object
 * @param {Object} aReS - The aReS context
 * @param {Object} db - The database definition
 * @return {Object} The exported database
 * 
 * @desc {en} Export a database as a REST API by mapper definition
 * @desc {it} Esporta una database come REST API tramite la definizione del mappatore
 * @desc {es} Exportar una base de datos como API REST por la definición de mapeador
 * @desc {pt} Exportar uma base de dados como API REST por definição do mapeador
 * @desc {fr} Exporter une base de données comme API REST par la définition du mappeur
 * @desc {de} Datenbank exportieren als REST API durch Definition der Mapper
 * @desc {ru} Экспортирует базу данных как API REST по определению маппера
 * @desc {zh} 将数据库导出为 REST API 通过映射定义
 * @desc {ja} データベースを REST API にエクスポートするマップデータを定義する
 * 
 */
export function exportDBQueryAsRESTService(aReS, querySetting, db) {
	asyncConsole.log('db', 'exportDBQueryAsRESTService: {\n\t\t' + db.name + ' ' + querySetting.name);
	if (!querySetting.mappers) return null;
	for (const mapper of querySetting.mappers) {
		const filter = (mapper.path?.match(uxFilePathRegex) || null);
		asyncConsole.log('db', '\t\tfilter: ' + mapper.path + ' ' + filter);
		if (filter) {
			asyncConsole.log('db', '\t\tpath: {' + (mapper.name || mapperCase));
			mapper.requestVariables = httpUtility.getRequestVariables(mapper.path);
			for (let method in httpUtility.httpMethods) {
				method = method.toUpperCase();
				const methods = new RegExp(mapper.methods, 'i');
				if (method.match(methods)) {
					asyncConsole.log('db', ' - init query "' + db.name + '.' + querySetting.name + '.' + mapper.name + '[' + method + '] -> ' + mapper.path + ';');
					aReS.server[httpUtility.httpMethods[method].expressMethod](mapper.path,
						(req, res) => {
							db[querySetting.name][mapper.name].execute(
								req,
								(queryResponse) => {
									if (queryResponse.error)
										httpUtility.sendError403(req, res, queryResponse.error);
									else res.json(queryResponse);
								},
							);
						}
					);
				}
			}
		}
	}
	console.log('}\n');
}

/**
 * @param {Object} aReS - The aReS context
 * @param {Object} dbList - The database list
 * @return {array} The exported database
 * 
 * @desc {en} Inject all routes for DB REST API
 * @desc {it} Inserisce tutte le rotte per l'API REST
 * @desc {es} Inyectar todas las rutas para la API REST
 * @desc {pt} Injetar todas as rotas para a API REST 
 * @desc {fr} Insérer toutes les routes pour l'API REST 
 * @desc {de} Alle Routen für die REST API einbetten 
 * @desc {ru} Внедите все маршруты для REST API 
 * @desc {zh} 注入所有数据库 REST API 的路由 
 * @desc {ja} DB REST API のルーティングをすべてインジェクト 
 * 
 */
export function loadAllDBRoutes(aReS, dbList) {
	aReS.server.use('/db', router);
}


dbCore.exportDBQueryAsRESTService = exportDBQueryAsRESTService;
dbCore.loadAllDBRoutes = loadAllDBRoutes;
export default dbCore;