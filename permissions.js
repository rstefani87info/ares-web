 import permissions from "../../../permissionData.json" assert { type: "json" };
 import httpUtility from "./http.js";

/**
 * @desc {en} Check if the resource is allowed based on the provided parameters.
 * @desc {it} Controlla se il riferimento è consentito in base ai parametri forniti.
 * @desc {es} Comprueba si el recurso esiste en base a los parametros proporcionados.
 * @desc {fr} Vérifie si la ressource est autorisée en fonction des paramètres fournis.

 * @desc {pt} Verifica se o recurso é permitido baseado em parâmetros fornecidos.



 *
 * @param {string} id - The ID of the resource
 * @param {string} [host=null] - The host of the resource (optional)
 * @param {string} [userId=null] - The user ID (optional)
 * @param {string} [userAgent=null] - The user agent (optional)
 * @param {string} [method='ALL'] - The method for resource access (optional, default is 'ALL')
 * @return {boolean} Whether the resource is allowed
 * 
 * @prototype {string}
 */

export function isResourceAllowed(
  id,
 req,
 stopMode=2
) {
  const method = req.method ? req.method.toUpperCase() : "ALL";
  id = id.toLowerCase();
  const host = req.ip;
  const userId = req.parameters['@userId'];
  const userAgent = req.headers['user-agent'];
  let filteredPermissions = getPermission(host, req.parameters['@userId'], req.headers['user-agent']);
  if(stopMode===0) return filteredPermissions.length > 0;
  if(stopMode===1 && filteredPermissions.length === 0) throw new Error("Permission denied");
  if(stopMode===2 && filteredPermissions.length === 0) permissionFail(id,req);
  return filteredPermissions.length > 0;
}

/**
 * @desc {en} Function to get filtered permissions based on host, userId, and userAgent.
 * @desc {it} Funzione per ottenere le autorizzazioni filtrate in base al host, l'ID utente e l'user agent.
 * @desc {es} Función para obtener las autorizaciones filtradas en base al host, el ID de usuario y el agente de usuario.
 * @desc {fr} Fonction pour obtenir les autorisations filtrées en fonction de l'host, de l'ID d'utilisateur et de l'user agent.

 * @desc {pt} Função para obter as permissoes filtradas baseado em host, userId e userAgent.



 * 
 * @param {string} host - The host for which permissions are being filtered
 * @param {string} userId - The user ID for which permissions are being filtered
 * @param {string} userAgent - The user agent for which permissions are being filtered
 * @return {array} The filtered permissions based on the provided parameters
 */
export function getPermission(host, userId, userAgent) {
  userId = (userId ?? "").match(/^\w+$/g) ? userId : "*";
  userAgent = userAgent ? userAgent : "*";
  let filteredPermissions = permissions.filter(
    (x) =>
      (x.hosts && x.hosts.length > 0
        ? x.hosts.indexOf(host + "")+x.hosts.indexOf("*")+1 >= 0
        : true) &&
      (x.userAgents && x.userAgents.length > 0
        ? x.userAgents.filter((y) => userAgent==="*" || y===userAgent || new RegExp(y).test(userAgent) ).length >= 0
        : true) &&
      (x.allowOnlyForUserId && x.allowOnlyForUserId.length > 0
        ? x.allowOnlyForUserId.indexOf(userId + "")  >= 0
        : true) &&
      !(x.dontAllowOnlyForUserId && x.dontAllowOnlyForUserId.length > 0
        ? x.allowOnlyForUserId.indexOf("!" + userId) >= 0
        : false)
  );
  return filteredPermissions;
}

/**
* @desc {en} function to handle permission failure by sending an error response with a 403 status code and a message "Permission denied".
* @desc {it} Funzione per gestire la fallimento della autorizzazione inviando una risposta di errore con un codice di stato 403 e un messaggio "Permesso negato".
* @desc {es} Función para manejar la fallida de la autorización enviando una respuesta de error con un código de estado 403 y un mensaje "Permiso denegado".
* @desc {fr} Fonction pour traiter la permission en erreur en envoyant une reponse d'erreur avec un code de statut 403 et un message "Permission refuse".

* @desc {pt} Função para tratar a falha da autorização enviando uma resposta de erro com um código de estado 403 e uma mensagem "Permissão negada".



* 
* @param {type} id - The ID parameter for the function
* @param {type} req - The request object
* @return {type} No explicit return value
*/
export function permissionFail(id,req) {
  httpUtility.sendError403(req, req.res, "Permission denied");
}

export default permissions;
