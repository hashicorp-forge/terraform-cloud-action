import { StateVersionOutputData } from "./client";
import * as core from "@actions/core";

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

export function redactSecrets(sv: StateVersionOutputData[]): void {
  sv.forEach(v => {
    if (v.attributes.sensitive) {
      core.setSecret(JSON.stringify(v.attributes.value));
    }
  });
}
