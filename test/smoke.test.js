import test from "node:test";
import assert from "node:assert/strict";
import express from "express";

import * as webServerModule from "@ares/web/server.js";
import * as jwtModule from "@ares/web/jwt.js";
import permissionsInitialize from "@ares/web/permissions.js";

function uniqueName(suffix) {
  return `web-smoke-${suffix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

test("self-referenced exports resolve both canonical and legacy subpaths", async () => {
  const [rootModule, serverLegacy, serverCanonical, jwtLegacy, jwtCanonical] = await Promise.all([
    import("@ares/web"),
    import("@ares/web/server"),
    import("@ares/web/server.js"),
    import("@ares/web/jwt"),
    import("@ares/web/jwt.js"),
  ]);

  assert.equal(typeof rootModule.default, "object");
  assert.equal(typeof rootModule.default.aReSInitialize, "function");
  assert.equal(typeof serverLegacy.getRoutes, "function");
  assert.equal(typeof serverCanonical.getRoutes, "function");
  assert.equal(typeof jwtLegacy.generateJWT, "function");
  assert.equal(jwtLegacy.generateJWT, jwtCanonical.generateJWT);
});

test("bootstrap server initializes httpServer and route registry without binding network ports", async () => {
  const originalListen = express.application.listen;
  let listenCalled = false;
  express.application.listen = function (port, callback) {
    listenCalled = true;
    if (typeof port === "function") {
      callback = port;
    }
    if (typeof callback === "function") {
      callback();
    }
    return {
      close: (done) => (typeof done === "function" ? done() : undefined),
      address: () => ({ port: Number(port) || 0 }),
    };
  };

  try {
    const aReS = {
      appSetup: {
        name: uniqueName("bootstrap"),
        environments: [],
        webDatasources: [],
        webServerPort: 0,
        permissions: [{ hosts: ["*"], userAgents: ["*"], allowedResource: ["*"], methods: ["ALL"] }],
      },
      getConfig: () => undefined,
      getPolicy: () => undefined,
    };

    await webServerModule.aReSInitialize(aReS);

    assert.equal(listenCalled, true);
    assert.ok(aReS.httpServer);
    assert.equal(typeof aReS.getRoutes, "function");
    assert.equal(typeof aReS.exportRESTRoute, "function");
    assert.equal(typeof aReS.extractToken, "function");
    assert.equal(typeof aReS.validateJWT, "function");

    const routes = aReS.getRoutes();
    assert.equal(Array.isArray(routes), true);
    assert.ok(routes.some((r) => r.path === "/" && r.method === "GET"));

    aReS.exportRESTRoute(
      "test.resource",
      { name: "test", path: "/test", methods: "GET" },
      async (req, res) => res.json({ ok: true })
    );
    const routesAfter = aReS.getRoutes();
    assert.ok(routesAfter.some((r) => r.path === "/test" && r.method === "GET"));
  } finally {
    express.application.listen = originalListen;
  }
});

test("JWT validation accepts a generated token and populates req.userId/sessionId", async () => {
  const secret = "test-secret";
  const aReS = {
    appSetup: { jwtSecret: secret },
    getConfig: () => undefined,
  };

  const token = jwtModule.generateJWT(aReS, "alice", "sess-1");
  const req = {
    headers: { authorization: `Bearer ${token}` },
    sessionId: "sess-1",
    sessionID: "sess-1",
    session: {},
  };
  const res = {
    statusCode: 200,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.payload = payload;
      return this;
    },
  };

  const ok = await jwtModule.validateJWT(aReS, req, res);
  assert.equal(ok, true);
  assert.equal(req.userId, "alice");
  assert.equal(req.sessionId, "sess-1");
});

test("permissions module filters allow/deny rules based on request context", () => {
  const aReS = {
    appSetup: {
      permissions: [
        {
          hosts: ["api.local"],
          userAgents: ["curl/*"],
          allowedResource: ["users.*"],
          allowOnlyForUserId: ["alice"],
          denyForUserId: ["bob"],
          methods: ["GET"],
        },
      ],
    },
    getPolicy: () => undefined,
  };

  permissionsInitialize(aReS);

  assert.equal(
    aReS.isResourceAllowed("users.list", { host: "api.local", headers: { "user-agent": "curl/9.0" }, method: "GET", userId: "alice" }, 0),
    true
  );
  assert.equal(
    aReS.isResourceAllowed("users.list", { host: "api.local", headers: { "user-agent": "curl/9.0" }, method: "GET", userId: "bob" }, 0),
    false
  );
});
