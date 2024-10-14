/**
 * @author Roberto Stefani
 * @license MIT
 */
export * from '@ares/core/datasources.js';
import { asyncConsole } from '@ares/core/console.js';
import httpUtility from '@ares/web/http.js';

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
	asyncConsole.log('datasources', ' - open REST: ' + (mapper.name ) + ':  ' +mapper.path);
	aReS.exportRESTRoute(datasource.name + '.' + mapper.name  , mapper, async(req, res) => {
		console.log('calling '+datasource.name + '.' + mapper.name)
		const result = await mapper.execute( req );
		if (result["€rror"])
			httpUtility.sendError403(req, res,result["€rror"]);
		else {
			if (mapper.transformToDTO && mapper.transformToDTO instanceof Function)
			result = mapper.transformToDTO(result);
			res.json(result);
		}
	});
	asyncConsole.log('datasources',' }');
}
