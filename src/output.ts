/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

import * as core from "@actions/core";
import { TFEClient } from "./client";
import { formatOutputs, redactSecrets } from "./outputs";

function configureClient(): TFEClient {
  return new TFEClient(core.getInput("hostname"), core.getInput("token"));
}

(async () => {
  try {
    const client = configureClient();
    const workspace = await client.readWorkspace(
      core.getInput("organization"),
      core.getInput("workspace")
    );
    const sv = await client.readCurrentStateVersion(workspace);

    redactSecrets(sv.included);

    core.setOutput("workspace-outputs-json", formatOutputs(sv.included));
  } catch (error) {
    core.setFailed(error.message);
  }
})();
