/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

import * as core from "@actions/core";
import { RunCreateOptions, TFEClient } from "./client";
import { DefaultLogger as log } from "./logger";

import { Runner } from "./runner";

function configureClient(): TFEClient {
  return new TFEClient(core.getInput("hostname"), core.getInput("token"));
}

function configureRunCreateOptions(wsID: string): RunCreateOptions {
  return {
    autoApply: core.getBooleanInput("auto-apply"),
    isDestroy: true,
    message: core.getInput("message"),
    workspaceID: wsID,
  };
}

const REQUIRED_VARIABLES = ["organization", "workspace", "token"];

(async () => {
  try {
    const client = configureClient();

    REQUIRED_VARIABLES.forEach(i => {
      if (core.getInput(i) === "") {
        throw new Error(`Input parameter ${i} is required but not provided.`);
      }
    });

    if (!["", "true"].includes(core.getState("cleanup"))) {
      log.info(
        "Cleanup needs to be set to true for cleanup run to be started."
      );
    }

    const ws = await client.readWorkspace(
      core.getInput("organization"),
      core.getInput("workspace")
    );
    const runner = new Runner(client, ws);
    let run = await runner.createRun(configureRunCreateOptions(ws.data.id));

    if (core.getBooleanInput("wait")) {
      run = await runner.waitFor(run);
    }

    log.debug(`Created run ${run.data.id}`);
    core.setOutput("run-id", run.data.id);
  } catch (error) {
    core.setFailed(error.message);
  }
})();
