const permissions = require('../permissions');
const mysql = require('mysql');
const filesUtility = require('./files');
const httpUtility = require('./http');
const app = require('../app');


const dbMap = {};

const mapRequestOrResult = (r) => r;

function exportDBAsREST(express, dbName, force = false) {

	dbName = dbName.toLowerCase();
	force = force || (!dbName in dbMap);
	if (force) {
		console.log('init db "' + dbName + '" {');
		const dbRoot = app.dbRoot + '/' + dbName;
		dbMap[dbName] = dbMap[dbName] ?? { sessions: {} };
		dbMap[dbName].dbRoot = dbRoot;
		dbMap[dbName].getConnection = function(req, force = false) {
			if (force || !dbMap[dbName].sessions[req.sessionId]) {
				dbMap[dbName].sessions[req.sessionId] = mysql.createConnection(require(dbRoot + '/connection')[app.isProduction ? 'production' : 'test']);
				dbMap[dbName].sessions[req.sessionId].connect((err) => {
					if (err) {
						delete dbMap[dbName].sessions[req.sessionId];
						throw err;
					}
					console.log(' Connected to database "' + dbName + '"!');
					dbMap[dbName].sessions[req.sessionId].on('end', () => {
						delete dbMap[dbName];
						console.log('Closed connection: ' + sessionId + ' ' + dbName);
					});
				});
			}
			return dbMap[dbName].sessions[req.sessionId];
		};
		dbMap[dbName].close = function(req) { dbMap[dbName].sessions[req.sessionId].connection.end(); };
		const files = filesUtility.getFilesRecoursively(dbMap[dbName].dbRoot, /.*\.sql$/i, true);
		for (const file of files) {
			if (filesUtility.isFile(file)) {
				const fileName = filesUtility.getFileName(file);
				const path = filesUtility.getRelativePathFrom(filesUtility.getParent(file), filesUtility.getParent(dbRoot)).replaceAll('\\', '/').replaceAll('{',':').replaceAll('}','');
				const mapperFile = filesUtility.getParent(file) + '/requestMapper';

				const mapperFileExt = mapperFile + '.js';

				dbMap[dbName][fileName] = {
					path: path,
					mapper: filesUtility.fileExists(mapperFileExt) ? require(mapperFile) : [{ methods: '.*', mapRequest: mapRequestOrResult, mapResult: mapRequestOrResult }],
					query: filesUtility.getFileContent(file),
					requestVariables: httpUtility.getRequestVariables(path),
				};


				dbMap[dbName][fileName].execute = function(request, response,mapper, callback) {
					if (!mapper.mapRequest) mapper.mapRequest = mapRequestOrResult;
					if (!mapper.mapResult) mapper.mapResult = mapRequestOrResult;
					if (!mapper.methods) mapper.methods = '.*';
					console.log(request.params);
					dbMap[dbName].getConnection(request).query(dbMap[dbName][fileName].query, mapper.mapRequest(request.params,request), (error, results, fields) => {
						if (error) { httpUtility.sendError403(request, response, error); throw error; }
						if (callback) callback(Array.isArray(results)?results.map((row,index) => mapper.mapResult(row,index)):mapper.mapResult(results) );
					});
				};

				for (const mapper of dbMap[dbName][fileName].mapper) {
					for (let method in httpUtility.httpMethods) {
						method = method.toUpperCase();
						const methods = new RegExp(mapper.methods, 'i');
						if (method.match(methods)) {
							console.log(' - init query "' + dbName + '.' + fileName + '[' + method + '] -> ' + dbMap[dbName][fileName].path + ';');
							express[httpUtility.httpMethods[method].expressMethod]('/' + dbMap[dbName][fileName].path,
								(req, res) => {
									if (permissions.isResourceAllowed(dbName, req.hostname.toLowerCase(), req.params['@clientUserId'], req.get('user-agent'), method)) {
										if(mapper.params ){
											for (const key in mapper.params) {
												 
											}
										}
										exportDBAsREST(express, dbName)[fileName].execute(req, res, mapper,(data) => { res.json(data); });
									}

								}
							);
						}
					}
				}
			}
		}
		console.log('}');
	}
	return dbMap[dbName];
}

function initAll(express) {
	const dbRoot = app.dbRoot;
	const files = filesUtility.getFilesRecoursively(dbRoot, /(.*[\/\\]){0,1}connection\.js/i, true);
	for (const file of files) {
		console.log('connection file found: "' + file + ';');
		const db = require(file.replace(/\.[jt]s[x]{0,1}/i, ''));
		exportDBAsREST(express, db.name, true);
	}
}


module.exports = { dbMap: dbMap, exportDBAsREST: exportDBAsREST, initAll: initAll };