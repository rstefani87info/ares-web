/**
 * @author Roberto Stefani
 * @license MIT
 */
export * from '@ares/core/datasources.js';
import { asyncConsole } from '@ares/core/console.js';
import httpUtility from './http.js';

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
		try{
			req.aReS = req.aReS ?? aReS;
			asyncConsole.log('datasources', `calling ${datasource.name}.${mapper.name}`);
			const result = await mapper.execute( req );
			if (result["€rror"])
				httpUtility.sendError403(req, res,{"@type":"ares-rest-response", "€rror":result["€rror"]});
			else {
				result["@type"]="ares-rest-response";
				res.set('X-Response-Brand', 'aReS');
				const MAX_METADATA_HEADER_BYTES = 6000;
				const setAReSMetadataHeader = (value) => {
					try {
						const metadataJson = JSON.stringify(value);
						if (Buffer.byteLength(metadataJson, 'utf8') <= MAX_METADATA_HEADER_BYTES) {
							res.set('X-aReS-Metadata', metadataJson);
							return true;
						}
					} catch {}
					return false;
				};

				const metadata = {...result};
				delete metadata.results;
				if (!setAReSMetadataHeader(metadata)) {
					setAReSMetadataHeader({
						"@type": "ares-rest-response-metadata",
						status: result?.status ?? 200,
						message: result?.message ?? null,
						url: result?.url ?? null,
						truncated: true
					});
				}
				res.json(result.results);
			}
		}
		catch(e){
			asyncConsole.log('datasources', { message: 'request error', error: e });
			httpUtility.sendError500(req, res, e, (err)=>({"@type":"ares-rest-response", "€rror": err instanceof Error ? err.message : err}));
		}
	});
	asyncConsole.log('datasources',' }');
}
