import {getApplicationRoot} from "@ares/core";
import * as app from "../../../app.js";
import { dirname } from "path"; // Import the path module

/**
 *
 * @param {string} url
 * @returns {boolean|{type:string,domain:string}}
 *
 * @desc {en} Check if url corresponds to production environment
 * @desc {it} Verifica se l'url corrisponde alla produzione
 * @desc {es} Comprueba si la url corresponde a la producción
 * @desc {pt} Verifica se l'url corrisponde alla produzione
 * @desc {fr} Vérifier si l'url correspond a l'environnement de production
 * @desc {de} Überprüfe, ob die URL zu der Produktionsumgebung passt
 * @desc {ja} プロダクション環境と一致するか確認
 * @desc {zh} 检查 URL 是否与生产环境匹配
 * @desc {ru} Проверьте, соответствует ли URL продуктивной среде
 *
 * */
export function isProduction(url) {
  return (
    environments.some(
      (x) => url.toLowerCase().startsWith(x.domain) && x.type === "production"
    )[0] ?? false
  );
}
export default app;
