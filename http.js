const filesUtility = require('./files');
/**
 * @prototype {string} 
 */
function getRequestVariables(this_string) {
	const matches = this_string.match(/\{([^}]+)\}/g);
	return (matches ? [...new Set(matches.map(match => match.slice(1, -1)))] : []).map(s => s.replace('{', '').replace('}', ''));
}

/**
 * @prototype {string} 
 */
function getRequest(this_string, root, application, ...methods) {
	methods = normalizeMethodsArray(methods);
	filesUtility.getRelativePathFrom(this_string, filesUtility.getPath(dbRoot))


}

/**
 * @prototype {string} 
 */
function getDomainName(this_string) {
	return new URL(this_string).hostname;
}

/**
 * @prototype {string} 
 */
function getDomainInfo(this_string, callback) {
	const domain = getDomainName(this_string);
	const whois = require('whois');
	whois.lookup(this_string, (err, data) => {
		if (err) {
			throw(err);
		}
		const jsonData = parseWhoisData(data);
		callback(jsonData);
	});

}

function normalizeMethodsArray(source) {
	return source.map(x => {
		if (typeof x == 'string') {
			if (!Number(x).isNaN()) return httpMethods[parseInt(x)];
			return x.toLowerCase();
		}
		if (typeof x == int) {
			return httpMethods[x];
		}
	}
	);
}

const httpMethods = {
	'ALL': { expressMethod: 'all', httpMethod: 'ALL' },
	'GET': { expressMethod: 'get', httpMethod: 'GET' },
	'POST': { expressMethod: 'post', httpMethod: 'POST' },
	'PUT': { expressMethod: 'put', httpMethod: 'PUT' },
	'DELETE': { expressMethod: 'delete', httpMethod: 'DELETE' },
	'PATCH': { expressMethod: 'patch', httpMethod: 'PATCH' },
	'OPTIONS': { expressMethod: 'options', httpMethod: 'OPTIONS' },
	'HEAD': { expressMethod: 'head', httpMethod: 'HEAD' },
	'COPY': { expressMethod: 'copy', httpMethod: 'COPY' },
	'LINK': { expressMethod: 'link', httpMethod: 'LINK' },
	'UNLINK': { expressMethod: 'unlink', httpMethod: 'UNLINK' },
};

function sendError(req, res, statusCode, message, error) {
	res.status(statusCode).json({ message: message, error: error });
}
function sendError100(req, res, error) { sendError(req, res, 100, 'Continue', error); }
function sendError200(req, res, error) { sendError(req, res, 200, 'OK', error); }
function sendError201(req, res, error) { sendError(req, res, 201, 'Created', error); }
function sendError204(req, res, error) { sendError(req, res, 204, 'No Content', error); }
function sendError301(req, res, error) { sendError(req, res, 301, 'Moved Permanently', error); }
function sendError302(req, res, error) { sendError(req, res, 302, 'Found (or Moved Temporarily)', error); }
function sendError304(req, res, error) { sendError(req, res, 304, 'Not Modified', error); }
function sendError400(req, res, error) { sendError(req, res, 400, 'Bad Request', error); }
function sendError401(req, res, error) { sendError(req, res, 401, 'Unauthorized', error); }
function sendError403(req, res, error) { sendError(req, res, 403, 'Forbidden', error); }
function sendError404(req, res, error) { sendError(req, res, 404, 'Not Found', error); }
function sendError500(req, res, error) { sendError(req, res, 500, 'Internal Server Error', error); }
function sendError502(req, res, error) { sendError(req, res, 502, 'Bad Gateway', error); }
function sendError503(req, res, error) { sendError(req, res, 503, 'Service Unavailable', error); }


module.exports = {
	sendError100:sendError100,
	sendError200:sendError200,
	sendError201:sendError201,
	sendError204:sendError204,
	sendError301:sendError301,
	sendError302:sendError302,
	sendError304:sendError304,
	sendError400:sendError400,
	sendError401:sendError401,
	sendError403:sendError403,
	sendError404:sendError404,
	sendError500:sendError500,
	sendError502:sendError502,
	sendError503:sendError503,
	sendError:sendError,httpMethods:httpMethods,
	getRequestVariables:getRequestVariables,
	getRequest:getRequest,
	getDomainInfo:getDomainInfo,
	getDomainName:getDomainName
	
	}