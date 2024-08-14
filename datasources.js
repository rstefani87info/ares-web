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
 * Export a database as a REST API by mapper definition
 * 
 */
export function exportDatasourceQueryAsRESTService(aReS, mapper, datasource) {
	asyncConsole.log('datasources', ' - open REST: {' + (mapper.name ) + ':  ' +mapper.path);
	aReS.exportRESTRoute(datasource.name + '.' + mapper.querySetting.name + '.' + mapper.name, mapper, (req, res) => {
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


datasourcesCore.exportDatasourceQueryAsRESTService = exportDatasourceQueryAsRESTService;