/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

import * as core from "@actions/core";
import { RunCreateOptions, TFEClient } from "./client";
import { DefaultLogger as log } from "./logger";
import { formatOutputs, redactSecrets } from "./outputs";

import { Runner } from "./runner";

function configureClient(): TFEClient {
  return new TFEClient(core.getInput("hostname"), core.getInput("token"));
}

function configureRunCreateOptions(wsID: string): RunCreateOptions {
  return {
    autoApply: core.getBooleanInput("auto-apply"),
    isDestroy: core.getBooleanInput("is-destroy"),
    message: core.getInput("message"),
    replaceAddrs: core.getMultilineInput("replace-addrs"),
    targetAddrs: core.getMultilineInput("target-addrs"),
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

    const ws = await client.readWorkspace(
      core.getInput("organization"),
      core.getInput("workspace")
    );
    const runner = new Runner(client, ws);
    let run = await runner.createRun(configureRunCreateOptions(ws.data.id));

    if (core.getBooleanInput("wait")) {
      run = await runner.waitFor(run);
    }

    const sv = await client.readCurrentStateVersion(ws);

    redactSecrets(sv.included);
    core.setOutput("workspace-outputs-json", formatOutputs(sv.included));
    log.debug(`Created run ${run.data.id}`);
    core.setOutput("run-id", run.data.id);
  } catch (error) {
    core.setFailed(error.message);
  }
})();