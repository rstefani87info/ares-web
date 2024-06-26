/**
 * @author Roberto Stefani
 * @license MIT
 */
import datasourcesCore from '@ares/core/datasources.js';
import { asyncConsole } from '@ares/core/console.js';
import httpUtility from '@ares/web/http.js';
export const datasourceMap = {};

/**
 * @param {Object} mapper - The request mapper object
 * @param {Object} aReS - The aReS context
 * @param {Object} datasource - The database definition
 * @return {Object} The exported database
 * 
 * @desc {en} Export a database as a REST API by mapper definition
 * @desc {it} Esporta una database come REST API tramite la definizione del mappatore
 * @desc {es} Exportar una base de datos como API REST por la definición de mapeador
 * @desc {pt} Exportar uma base de dados como API REST por definição do mapeador
 * @desc {fr} Exporter une base de données comme API REST par la définition du mappeur
 * 
 */
export function exportDatasourceQueryAsRESTService(aReS, mapper, datasource) {
	asyncConsole.log('datasources', ' - open REST: {' + (mapper.name ) + ':  ' +mapper.path);
	aReS.exportRoute(datasource.name + '.' + mapper.querySetting.name + '.' + mapper.name, mapper, (req, res) => {
		mapper.execute(
			req,
			(queryResponse) => {
				if (queryResponse.error)
					httpUtility.sendError403(req, res, queryResponse.error);
				else res.json(queryResponse);
			},
		);
	});
	asyncConsole.log('datasources',' - }');
}

/**
 * @param {Object} aReS - The aReS context
 * @param {Object} datasourceList - The database list
 * @return {array} The exported database
 * 
 * @desc {en} Inject all routes for Datasource REST API
 * @desc {it} Inserisce tutte le rotte per l'API REST
 * @desc {es} Inyectar todas las rutas para la API REST
 * @desc {pt} Injetar todas as rotas para a API REST 
 * @desc {fr} Insérer toutes les routes pour l'API REST 
 * 
 */
export function loadAllDatasourceRoutes(aReS, datasourceList) {
	aReS.server.use('/datasource', router);
}


datasourcesCore.exportDatasourceQueryAsRESTService = exportDatasourceQueryAsRESTService;
datasourcesCore.loadAllDatasourceRoutes = loadAllDatasourceRoutes;
export default datasourcesCore;