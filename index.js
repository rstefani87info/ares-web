/**
 * @author Roberto Stefani
 * @license MIT
 */

import express from "express";
import expressSession from "express-session";
import cors from "cors";
import { json } from "body-parser";
import aReS from "@ares/core";
import app, { isProduction} from "../../../app.js";
import { initAll } from "./db.js";

export default  aReS = ((sessionSecret, cookie , pages) => {
  aReS.server = express();
  aReS.app = app;
  aReS.permissionData = aReS.files.getFileContent("../../../permissionData.json");
  initAll(aReS.server);
  install(aReS.server);

  aReS.server.use(
    expressSession({
      secret: aReS.crypto.getMD5Hash(sessionSecret),
      resave: false,
      saveUninitialized: true,
      cookie: cookie
    })
  );

  aReS.server.use((req, res, next) => {
    isProduction =
      app.environments.filter(
        (x) =>
          x.domain.toLowerCase() == req.hostname.toLowerCase() &&
          x.type.toLowerCase() == "production"
      ).length >= 0;
    console.log("app.isProduction=" + isProduction);
    if (req.cookies && req.cookies[app.md5Name()]) {
      req.session.regenerate((err) => {
        if (!err) {
          req.session.openingTime = moment().toDate();
          req.session.id = getMD5Hash(
            req.get("user-agent") +
              " " +
              req.params["@clientUserId"] +
              moment(req.session.openingTime).format("YYYYMMDDHHmmss")
          );
        }
        next();
      });
    } else {
      next();
    }
  });

  aReS.server.get('/', (req, res) => {
    pages.home??pages.index??pages.default;
  });

  aReS.server.use(json());
  aReS.server.use(cors());

  aReS.server.listen(3000, () => {
    console.log("Server started on port 3000");
  });
  return aReS;
})();