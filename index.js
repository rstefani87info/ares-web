/**
 * @author Roberto Stefani
 * @license MIT
 */

import express from "express";
import expressSession from "express-session";
import cors from "cors";
import { json } from "body-parser";
import aReS, { crypto, files, localAI } from "@ares/core";
import app, { isProduction, environments, md5Name } from "../../../app";
import { initAll } from "./db";

aReS = (() => {
  aReS.server = express();
  aReS.permissionData = files.getFileContent("../../../app");
  initAll(aReS.server);
  install(aReS.server);

  aReS.server.use(
    expressSession({
      secret: crypto.getMD5Hash("321party2024"),
      resave: false,
      saveUninitialized: true,
      cookie: {
        maxAge: 24 * 60 * 60 * 1000,
      },
    })
  );

  aReS.server.use((req, res, next) => {
    isProduction =
      environments.filter(
        (x) =>
          x.domain.toLowerCase() == req.hostname.toLowerCase() &&
          x.type.toLowerCase() == "production"
      ).length >= 0;
    console.log("app.isProduction=" + isProduction);
    if (req.cookies && req.cookies[md5Name()]) {
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

  // aReS.server.get('/', (req, res) => {
  //   res.json(app);
  // });

  aReS.server.use(json());
  aReS.server.use(cors());

  aReS.server.listen(3000, () => {
    console.log("Server started on port 3000");
  });
  return aReS;
})();

export default aReS;
