import * as core from "@actions/core";

export function setupMOTD(): () => Promise<void> {
  return printer;
}

async function printer() {
  await core.info(core.getInput("motd"));
}
