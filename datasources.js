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
		try{
			const result = await mapper.execute( req );
			if (result["€rror"])
				httpUtility.sendError403(req, res,{"@type":"ares-rest-response", "€rror":result["€rror"]});
			else {
				result["@type"]="ares-rest-response";
				console.log('result::',result);
				res.json(result);
			}
		}
		catch(e){
			console.error('request error:', e.constructor.name+'::' ,e);
			httpUtility.sendError403(req, res, e, (e)=>({"@type":"ares-rest-response", "€rror":e}));
		}
	});
	asyncConsole.log('datasources',' }');
}
