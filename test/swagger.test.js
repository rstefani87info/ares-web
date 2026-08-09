import test from "node:test";
import assert from "node:assert/strict";

import { exportDatasourceQueryAsSwaggerSetupService } from "@ares/web/swagger.js";

test("swagger generator exports minimal OpenAPI paths for a mapper", () => {
  const setting = { paths: {}, components: { schemas: {} } };
  const aReS = { appSetup: { name: "test" } };
  const datasource = { name: "users" };
  const mapper = {
    name: "getById",
    path: "/api/users/{id}",
    methods: "GET POST",
    querySetting: { name: "main" },
    parameters: {
      id: { type: "string", required: true, description: "User id" },
      limit: { type: "number", required: false },
    },
  };

  exportDatasourceQueryAsSwaggerSetupService(setting, aReS, mapper, datasource);

  assert.ok(setting.paths["/api/users/{id}"]);
  assert.ok(setting.paths["/api/users/{id}"].get);
  assert.ok(setting.paths["/api/users/{id}"].post);

  const operation = setting.paths["/api/users/{id}"].get;
  assert.equal(operation.operationId, "users.main.getById");
  assert.equal(Array.isArray(operation.parameters), true);
  const idParam = operation.parameters.find((p) => p.name === "id");
  assert.ok(idParam);
  assert.equal(idParam.in, "path");
  assert.equal(idParam.required, true);
});
