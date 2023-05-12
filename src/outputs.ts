/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

import * as core from "@actions/core";
import { StateVersionOutputData, TFEClient } from "./client";

type outputByKey = { [varName: string]: any };

export function formatOutputs(sv: StateVersionOutputData[]): string {
  const outputsByKey = sv.reduce((acc, output) => {
    if (output.type === "state-version-outputs") {
      acc[output.attributes.name] = output.attributes.value;
      return acc;
    }
  }, {} as outputByKey);

  return JSON.stringify(outputsByKey);
}

function redactRecursive(value: any): void {
  if (value == null || typeof value === "boolean") {
    return;
  }

  if (Array.isArray(value)) {
    value.forEach(redactRecursive);
  } else if (value instanceof Object && value != null) {
    // We expect object output to be a JSON value, so there's no
    // need to ensure this is a "hasOwnProperty" prop
    for (const prop in value) {
      redactRecursive(value[prop]);
    }
  } else if (typeof value === "string") {
    core.setSecret(value);
  } else if (typeof value === "number") {
    core.setSecret(JSON.stringify(value));
  }
}

export function redactSecrets(sv: StateVersionOutputData[]): void {
  sv.forEach(v => {
    if (v.attributes.sensitive) {
      redactRecursive(v.attributes.value);
    }
  });
}

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
