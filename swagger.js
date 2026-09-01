import * as datasources from "./datasources.js";
import { asyncConsole } from "@ares/core/console.js";
import path from "path";
import { setFileContentSync } from "@ares/files";
import { XHRWrapper } from "@ares/core/xhr.js";

async function loadOptionalModule(name) {
  try {
    return await import(name);
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    err.message = `Missing optional dependency "${name}" required by @ares/web/swagger: ${err.message}`;
    throw err;
  }
}

/**
 * Normalize a route path to an OpenAPI-compatible path string.
 *
 * @param {string} value
 * @returns {string}
 */
function normalizeSwaggerPath(value) {
  const stringValue = String(value ?? "");
  if (!stringValue) return "/";
  return stringValue.startsWith("/") ? stringValue : `/${stringValue}`;
}

/**
 * Normalize mapper methods into a list of HTTP method tokens.
 *
 * @param {string|string[]|undefined|null} value
 * @returns {string[]}
 */
function normalizeHTTPMethods(value) {
  if (Array.isArray(value)) {
    return value.map((entry) => String(entry).trim().toUpperCase()).filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(/[,\s]+/g)
      .map((entry) => entry.trim().toUpperCase())
      .filter(Boolean);
  }

  return ["GET"];
}

/**
 * Converts a mapper parameter type into an OpenAPI schema $ref when the type
 * looks like a path/module reference, otherwise returns null.
 *
 * @param {string} type
 * @returns {string|null}
 */
function normalizeSchemaTypeToRef(type) {
  if (typeof type !== "string" || !type.trim()) return null;
  if (!/[\/\\\.]/.test(type)) return null;
  const normalized = type
    .replaceAll("\\", "/")
    .replaceAll("./", "")
    .replaceAll(".\\", "")
    .replaceAll(".js", "");
  return `#/components/schemas/${normalized}`;
}

/**
 * Builds an OpenAPI parameters array from a mapper `parameters` object.
 *
 * @param {Record<string, {type?: string, description?: string, required?: boolean}>} mapperParameters
 * @param {string} pathLevel
 * @returns {Array<{name: string, in: string, description?: string, required: boolean, schema: object}>}
 */
function buildOperationParameters(mapperParameters, pathLevel) {
  if (!mapperParameters || typeof mapperParameters !== "object") return [];
  const parameters = [];

  for (const [name, param] of Object.entries(mapperParameters)) {
    const normalizedName = String(name);
    const schema = {};
    const type = param?.type;
    const ref = normalizeSchemaTypeToRef(type);
    if (ref) schema["$ref"] = ref;
    else if (typeof type === "string" && type.trim()) schema.type = type;

    const inValue = pathLevel.includes(`{${normalizedName}}`) ? "path" : "query";
    parameters.push({
      name: normalizedName,
      in: inValue,
      description: param?.description,
      required: inValue === "path" ? true : Boolean(param?.required),
      schema,
    });
  }

  return parameters;
}

/**
 * Converts a response payload into a Node.js Buffer suitable for `fs.writeFileSync`.
 *
 * @param {*} data
 * @returns {Buffer}
 */
function toNodeBuffer(data) {
  if (!data) return Buffer.alloc(0);
  if (Buffer.isBuffer(data)) return data;
  if (data instanceof ArrayBuffer) return Buffer.from(new Uint8Array(data));
  if (ArrayBuffer.isView(data)) return Buffer.from(data.buffer);
  if (typeof data === "string") return Buffer.from(data);
  return Buffer.from(JSON.stringify(data));
}

/**
 * Builds an OpenAPI 3 specification by inspecting the configured `webDatasources`
 * and their loaded mappers.
 *
 * @param {import("@ares/core").ARES} aReS
 * @returns {Promise<object>}
 */
export async function loadSwaggerSetting(aReS) {
  const setting = {
    openapi: "3.0.0",
    info: {
      title: aReS?.appSetup?.name ?? "aReS API",
      version: aReS?.appSetup?.version ?? "1.0.0",
    },
    paths: {},
    components: { schemas: {} },
  };

  const datasourceList = aReS?.appSetup?.webDatasources ?? [];
  for (const datasourceSettings of datasourceList) {
    const datasource = await datasources.loadDatasource(aReS, datasourceSettings, undefined, false);
    const queryDefinitions = datasource?.queries && typeof datasource.queries === "object"
      ? Object.values(datasource.queries)
      : [];

    for (const queryDefinition of queryDefinitions) {
      const mapperName = queryDefinition?.name;
      const mapper = mapperName ? datasource?.[mapperName] : null;
      if (!mapper) continue;
      exportDatasourceQueryAsSwaggerSetupService(setting, aReS, mapper, datasource);
    }
  }

  return setting;
}

/**
 * Persists the generated OpenAPI spec as `swagger.json` under the given output path.
 *
 * @param {import("@ares/core").ARES} aReS
 * @param {string} outputPath
 * @returns {Promise<boolean>}
 */
export async function saveSwaggerSetting(aReS, outputPath) {
  const setting = await loadSwaggerSetting(aReS);
  const files = await loadOptionalModule("@ares/files");
  files.setFileContent(`${outputPath}/swagger.json`, JSON.stringify(setting, null, 2));
  return true;
}

/**
 * Enriches an OpenAPI spec by translating a single datasource mapper into one or more
 * OpenAPI operations under `setting.paths`.
 *
 * @param {object} setting
 * @param {import("@ares/core").ARES} aReS
 * @param {object} mapper
 * @param {object} datasource
 * @returns {void}
 */
export function exportDatasourceQueryAsSwaggerSetupService(setting, aReS, mapper, datasource) {
  asyncConsole.log("datasources", ` - open REST: {${mapper.name}: ${mapper.path}`);

  const pathLevel = normalizeSwaggerPath(mapper.path);
  const operationId = `${datasource.name}.${mapper?.querySetting?.name ?? "default"}.${mapper.name}`;
  const parameters = buildOperationParameters(mapper.parameters, pathLevel);

  const operation = {
    summary: mapper.summary,
    description: mapper.description,
    operationId,
    parameters,
    responses: mapper.responses ?? {
      "200": { description: "OK" },
    },
  };

  setting.paths[pathLevel] = setting.paths[pathLevel] ?? {};
  for (const method of normalizeHTTPMethods(mapper.methods)) {
    setting.paths[pathLevel][method.toLowerCase()] = operation;
  }

  asyncConsole.log("datasources", " - }");
}

/**
 * Generates a client SDK using SwaggerHub codegen and extracts the resulting ZIP
 * into the provided output directory.
 *
 * @param {import("@ares/core").ARES} aReS
 * @param {string} language
 * @param {string} apiUsername
 * @param {string} apiName
 * @param {string} apiVersion
 * @param {string} apiKey
 * @param {string} packageName
 * @param {string} outputPath
 * @returns {Promise<boolean>}
 */
export async function generate(
  aReS,
  language,
  apiUsername,
  apiName,
  apiVersion,
  apiKey,
  packageName,
  outputPath
) {
  try {
    const unzipperModule = await loadOptionalModule("unzipper");
    const unzipper = unzipperModule?.default ?? unzipperModule;

    await saveSwaggerSetting(aReS, outputPath);
    const files = await loadOptionalModule("@ares/files");
    const specContent = files.getFileContent(`${outputPath}/swagger.json`);

    const endpointPath = `/apis/${apiUsername}/${apiName}/${apiVersion}/swagger-codegen/clients/${language}`;
    const requestBody = {
      spec: specContent,
      options: {
        packageName: packageName,
      },
    };

    const xhr = new XHRWrapper("https://api.swaggerhub.com", null, Boolean(aReS?.isProduction));
    const response = await xhr.post(endpointPath, requestBody, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      responseType: "arraybuffer",
    });

    if (response?.["€rror"] || response?.status >= 400) {
      throw new Error(response?.message ?? "Swagger generation failed");
    }

    const zipFilePath = path.join(outputPath, "generated_code.zip");
    setFileContentSync(zipFilePath, toNodeBuffer(response?.results));

    await new Promise((resolve, reject) => {
      const fs = await import("fs");
      fs.createReadStream(zipFilePath)
        .pipe(unzipper.Extract({ path: outputPath }))
        .on("close", resolve)
        .on("error", reject);
    });

    return true;
  } catch (error) {
    console.error("Error generating code:", error);
    return false;
  }
}
