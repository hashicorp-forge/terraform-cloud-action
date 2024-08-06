var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __async = (__this, __arguments, generator) => {
  return new Promise((resolve, reject) => {
    var fulfilled = (value) => {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    };
    var rejected = (value) => {
      try {
        step(generator.throw(value));
      } catch (e) {
        reject(e);
      }
    };
    var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
    step((generator = generator.apply(__this, __arguments)).next());
  });
};

// src/destroy.ts
var core2 = __toESM(require("@actions/core"));

// src/client.ts
var import_axios = __toESM(require("axios"));
var import_axios_retry = __toESM(require("axios-retry"));
var querystring = __toESM(require("querystring"));

// src/logger.ts
var core = __toESM(require("@actions/core"));
var DefaultLogger = core;

// src/client.ts
var TFEClient = class {
  constructor(hostname, token) {
    this.client = import_axios.default.create({
      baseURL: `https://${hostname}`,
      timeout: 3e4,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.api+json",
        "Content-Type": "application/vnd.api+json"
      }
    });
    (0, import_axios_retry.default)(this.client, {
      retries: 3,
      retryDelay: import_axios_retry.default.exponentialDelay
    });
  }
  readWorkspace(organization, workspace) {
    return __async(this, null, function* () {
      try {
        const path = `/api/v2/organizations/${querystring.escape(
          organization
        )}/workspaces/${querystring.escape(workspace)}`;
        DefaultLogger.debug(`client readWorkspace ${path}`);
        const workspaceResponse = yield this.client.get(path);
        DefaultLogger.debug(`client readWorkspace success`);
        return workspaceResponse.data;
      } catch (err) {
        throw new Error(`Failed to read workspace: ${err.message}`);
      }
    });
  }
  readCurrentStateVersion(workspaceResponse) {
    return __async(this, null, function* () {
      const path = workspaceResponse.data.relationships["current-state-version"].links.related;
      try {
        DefaultLogger.debug(`client readCurrentStateVersion ${path}`);
        const stateVersionResponse = yield this.client.get(path, {
          params: {
            include: "outputs"
          }
        });
        DefaultLogger.debug(`client readCurrentStateVersion success`);
        return stateVersionResponse.data;
      } catch (err) {
        throw new Error(`Failed to read ${path}: ${err.message}`);
      }
    });
  }
  readRun(id) {
    return __async(this, null, function* () {
      try {
        const path = `/api/v2/runs/${querystring.escape(id)}`;
        DefaultLogger.debug(`client readRun ${path}`);
        const resp = yield this.client.get(path);
        DefaultLogger.debug(`client readRun success`);
        return resp.data;
      } catch (err) {
        throw new Error(`Failed to read run status ${id}: ${err.message}`);
      }
    });
  }
  createRun(opts) {
    return __async(this, null, function* () {
      try {
        const attributes = {
          message: opts.message,
          "auto-apply": opts.autoApply,
          "is-destroy": opts.isDestroy
        };
        if (opts.replaceAddrs) {
          attributes["replace-addrs"] = opts.replaceAddrs;
        }
        if (opts.targetAddrs) {
          attributes["target-addrs"] = opts.targetAddrs;
        }
        const path = "/api/v2/runs";
        DefaultLogger.debug(`client createRun ${path}`);
        const resp = yield this.client.post(path, {
          data: {
            attributes,
            type: "runs",
            relationships: {
              workspace: {
                data: {
                  type: "workspaces",
                  id: opts.workspaceID
                }
              }
            }
          }
        });
        DefaultLogger.debug(`client createRun success`);
        return resp.data;
      } catch (err) {
        throw new Error(
          `Failed to create run on workspace ${opts.workspaceID}: ${err.message}`
        );
      }
    });
  }
};

// src/runner.ts
var pollIntervalRunMs = 4e3;
var pollIntervalResourcesMs = 1e3;
function sleep(interval) {
  return __async(this, null, function* () {
    yield new Promise((resolve) => setTimeout(resolve, interval));
  });
}
var Runner = class {
  constructor(client, workspace) {
    this.client = client;
    this.workspace = workspace;
  }
  waitFor(run) {
    return __async(this, null, function* () {
      run = yield this.pollWaitForRun(run);
      yield this.pollWaitForResources(this.workspace);
      return run;
    });
  }
  createRun(opts) {
    return __async(this, null, function* () {
      opts.workspaceID = this.workspace.data.id;
      return yield this.client.createRun(opts);
    });
  }
  pollWaitForResources(ws) {
    return __async(this, null, function* () {
      let sv = yield this.client.readCurrentStateVersion(ws);
      DefaultLogger.info(`Waiting for workspace ${ws.data.id} to process resources...`);
      while (!sv.data.attributes["resources-processed"]) {
        yield sleep(pollIntervalResourcesMs);
        sv = yield this.client.readCurrentStateVersion(ws);
      }
    });
  }
  pollWaitForRun(run) {
    return __async(this, null, function* () {
      poll: while (true) {
        switch (run.data.attributes.status) {
          case "canceled":
          case "force_canceled":
          case "errored":
          case "discarded":
            throw new Error(
              `run exited unexpectedly with status: ${run.data.attributes.status}`
            );
          case "planned_and_finished":
          case "applied":
            break poll;
        }
        DefaultLogger.info(
          `Waiting for run ${run.data.id} to complete, status was '${run.data.attributes.status}'...`
        );
        yield sleep(pollIntervalRunMs);
        run = yield this.client.readRun(run.data.id);
      }
      return run;
    });
  }
};

// src/destroy.ts
function configureClient() {
  return new TFEClient(core2.getInput("hostname"), core2.getInput("token"));
}
function configureRunCreateOptions(wsID) {
  return {
    autoApply: core2.getBooleanInput("auto-apply"),
    isDestroy: true,
    message: core2.getInput("message"),
    workspaceID: wsID
  };
}
var REQUIRED_VARIABLES = ["organization", "workspace", "token"];
(() => __async(exports, null, function* () {
  try {
    const client = configureClient();
    REQUIRED_VARIABLES.forEach((i) => {
      if (core2.getInput(i) === "") {
        throw new Error(`Input parameter ${i} is required but not provided.`);
      }
    });
    const ws = yield client.readWorkspace(
      core2.getInput("organization"),
      core2.getInput("workspace")
    );
    const runner = new Runner(client, ws);
    let run = yield runner.createRun(configureRunCreateOptions(ws.data.id));
    if (core2.getBooleanInput("wait")) {
      run = yield runner.waitFor(run);
    }
    core2.setOutput("run-id", run.data.id);
  } catch (error) {
    core2.setFailed(error.message);
  }
}))();
