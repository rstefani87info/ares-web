import path from 'path';
/**
 * @prototype {string} 
 */
export function getRequestVariables(this_string) {
	const matches = this_string.match(/\{([^}]+)\}/g);
	return (matches ? [...new Set(matches.map(match => match.slice(1, -1)))] : []).map(s => s.replace('{', '').replace('}', ''));
}

/**
 * @prototype {string} 
 */
export function getRequest(this_string, root, application, ...methods) {
	methods = normalizeMethodsArray(methods);
	return path.relative(root, this_string)
}

/**
 * @prototype {string} 
 */
export function getDomainName(this_string) {
	return new URL(this_string).hostname;
}

/**
 * @prototype {string} 
 */
export async function getDomainInfo(this_string, callback) {
	const domain = getDomainName(this_string);
	const whois = await import('whois');
	whois.lookup(this_string, (err, data) => {
		if (err) {
			throw (err);
		}
		const jsonData = parseWhoisData(data);
		callback(jsonData);
	});

}

export function normalizeMethodsArray(source) {
	const values = Array.isArray(source) ? source : [source];
	const methodOrder = ['ALL', 'GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD', 'COPY', 'LINK', 'UNLINK'];

	return values
		.map(x => {
			if (x === undefined || x === null) return null;

			if (typeof x === 'number' && Number.isFinite(x)) {
				const idx = Math.trunc(x);
				const key = methodOrder[idx];
				return key ? httpMethods[key].expressMethod : null;
			}

			if (typeof x === 'string') {
				const trimmed = x.trim();
				if (!trimmed) return null;

				const numericCandidate = Number(trimmed);
				if (Number.isInteger(numericCandidate) && String(numericCandidate) === trimmed) {
					const key = methodOrder[numericCandidate];
					return key ? httpMethods[key].expressMethod : null;
				}

				const upper = trimmed.toUpperCase();
				if (upper in httpMethods) return httpMethods[upper].expressMethod;
				return trimmed.toLowerCase();
			}

			if (typeof x === 'object') {
				const expressMethod = x.expressMethod;
				if (typeof expressMethod === 'string' && expressMethod.trim()) return expressMethod.trim().toLowerCase();

				const httpMethod = x.httpMethod;
				if (typeof httpMethod === 'string' && httpMethod.trim()) {
					const upper = httpMethod.trim().toUpperCase();
					if (upper in httpMethods) return httpMethods[upper].expressMethod;
					return upper.toLowerCase();
				}
			}

			return null;
		})
		.filter(Boolean);
}

export const httpMethods = {
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

function isDiagnosticsEnabled(req) {
	const isProduction = Boolean(req?.aReS?.isProduction);
	return Boolean(
		req?.aReS?.getLoggingConfig?.()?.diagnostics ??
		req?.aReS?.getConfig?.('logging.diagnostics', false) ??
		req?.aReS?.appSetup?.config?.logging?.diagnostics
	) && !isProduction;
}

export function sendError(req, res, statusCode, message, error, formatter=null) {
	formatter=formatter ?? ((e, message, req) => ({
		message: message,
		error: e instanceof Error ? (isDiagnosticsEnabled(req) && e.stack ? `${e.message}\n${e.stack}` : e.message) : e
	}));
	res.status(statusCode).json(formatter(error, message, req, statusCode));
}
export function sendError100(req, res, error, formatter) { sendError(req, res, 100, 'Continue', error, formatter); }
export function sendError200(req, res, error, formatter) { sendError(req, res, 200, 'OK', error, formatter); }
export function sendError201(req, res, error, formatter) { sendError(req, res, 201, 'Created', error, formatter); }
export function sendError204(req, res, error, formatter) { sendError(req, res, 204, 'No Content', error, formatter); }
export function sendError301(req, res, error, formatter) { sendError(req, res, 301, 'Moved Permanently', error, formatter); }
export function sendError302(req, res, error, formatter) { sendError(req, res, 302, 'Found (or Moved Temporarily)', error, formatter); }
export function sendError304(req, res, error, formatter) { sendError(req, res, 304, 'Not Modified', error, formatter); }
export function sendError400(req, res, error, formatter) { sendError(req, res, 400, 'Bad Request', error, formatter); }
export function sendError401(req, res, error, formatter) { sendError(req, res, 401, 'Unauthorized', error, formatter); }
export function sendError403(req, res, error, formatter) { sendError(req, res, 403, 'Forbidden', error, formatter); }
export function sendError404(req, res, error, formatter) { sendError(req, res, 404, 'Not Found', error, formatter); }
export function sendError500(req, res, error, formatter) { sendError(req, res, 500, 'Internal Server Error', error, formatter); }
export function sendError502(req, res, error, formatter) { sendError(req, res, 502, 'Bad Gateway', error, formatter); }
export function sendError503(req, res, error, formatter) { sendError(req, res, 503, 'Service Unavailable', error, formatter); }

export function getAllParamsByMethod(req) {
	let ret=req.params??{};
	if (req.method === 'GET' || req.method === 'DELETE') {
		ret = Object.assign({}, ret, req.query??{}); 
	} else {
		if (typeof req.body === 'string') {
			const queryString = req.body;
			const params = {};
			const pairs = queryString.split('&');
			for (const pair of pairs) {
				const [key, value] = pair.split('=');
				params[key] = value;
			}
			ret = params;
		} else if (typeof req.body === 'object') {
			ret = req.body;
		}
	}
	return {...ret, ...req.params};
}
export function getAllParams(req) {
	req = { ...req };
	req.method = 'GET';
	const get = getAllParamsByMethod(req);
	req.method = 'POST';
	const post = getAllParamsByMethod(req);
	return { ...get, ...post, ...req.params };
}
/**
 * Convert object to query string
 * @param {*} params 
 * @returns 
 * 
 * @prototype {Object}
 */
export function toQueryString(this_params) {
	return Object.keys(this_params)
		.map(key => encodeURIComponent(key) + '=' + encodeURIComponent(this_params[key]??''))
		.join('&');
}
const http = {
	sendError100: sendError100,
	sendError200: sendError200,
	sendError201: sendError201,
	sendError204: sendError204,
	sendError301: sendError301,
	sendError302: sendError302,
	sendError304: sendError304,
	sendError400: sendError400,
	sendError401: sendError401,
	sendError403: sendError403,
	sendError404: sendError404,
	sendError500: sendError500,
	sendError502: sendError502,
	sendError503: sendError503,
	sendError: sendError, 
	httpMethods,
	getRequestVariables: getRequestVariables,
	getRequest: getRequest,
	getDomainInfo: getDomainInfo,
	getDomainName: getDomainName,
	getAllParamsByMethod: getAllParamsByMethod,
	getAllParams: getAllParams,
	toQueryString: toQueryString
}
	;
export default http;
