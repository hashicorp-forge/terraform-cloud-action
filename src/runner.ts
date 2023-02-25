/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

import {
  RunCreateOptions,
  RunResponse,
  TFEClient,
  WorkspaceShowResponse,
} from "./client";
import { DefaultLogger as log } from "./logger";

const pollIntervalRunMs = 4000;
const pollIntervalResourcesMs = 1000;

async function sleep(interval: number): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, interval));
}

export class Runner {
  private client: TFEClient;
  private workspace: WorkspaceShowResponse;

  constructor(client: TFEClient, workspace: WorkspaceShowResponse) {
    this.client = client;
    this.workspace = workspace;
  }

  public async waitFor(run: RunResponse): Promise<RunResponse> {
    run = await this.pollWaitForRun(run);
    await this.pollWaitForResources(this.workspace);
    return run;
  }

  public async createRun(opts: RunCreateOptions): Promise<RunResponse> {
    opts.workspaceID = this.workspace.data.id;
    return await this.client.createRun(opts);
  }

  private async pollWaitForResources(ws: WorkspaceShowResponse): Promise<void> {
    let sv = await this.client.readCurrentStateVersion(ws);
    log.info(`Waiting for workspace ${ws.data.id} to process resources...`);
    while (!sv.data.attributes["resources-processed"]) {
      await sleep(pollIntervalResourcesMs);
      sv = await this.client.readCurrentStateVersion(ws);
    }
  }

  private async pollWaitForRun(run: RunResponse): Promise<RunResponse> {
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
          break poll; // Without label, only breaks the switch statement
      }
      log.info(
        `Waiting for run ${run.data.id} to complete, status was '${run.data.attributes.status}'...`
      );
      await sleep(pollIntervalRunMs);
      run = await this.client.readRun(run.data.id);
    }

    return run;
  }
}
