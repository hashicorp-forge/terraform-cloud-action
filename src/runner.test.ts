/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

import { Runner } from "./runner";
import { MockTFEClient, newMockTFEClient } from "./client.test";
import { RunCreateOptions } from "./client";

export interface MockTfRunner {
  runner: Runner;
  tfeClient: MockTFEClient;
  defaultRunOpts: RunCreateOptions;
}

export const newMockTfRunner = async (): Promise<MockTfRunner> => {
  const tfeClient = newMockTFEClient();
  const ws = await tfeClient.client.readWorkspace("hashicorp", "foobar");
  const runner = new Runner(tfeClient.client, ws);

  const defaultRunOpts: RunCreateOptions = {
    autoApply: true,
    isDestroy: false,
    message: "Foobar",
    workspaceID: tfeClient.defaultWorkspaceID,
  };

  return {
    runner,
    tfeClient,
    defaultRunOpts,
  };
};

describe("Runner", () => {
  let mockRunnerP: Promise<MockTfRunner>;
  jest.useFakeTimers();

  beforeAll(() => {
    mockRunnerP = newMockTfRunner();
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  test("creates run but does not wait", async () => {
    try {
      const mockRunner = await mockRunnerP;
      const run = await mockRunner.runner.createRun(mockRunner.defaultRunOpts);
      expect(run.data.id).toBe(mockRunner.tfeClient.defaultRunID);
    } catch (err) {
      console.log(err);
    }
  });

  test("creates run and waits for run", async () => {
    const mockRunner = await mockRunnerP;
    const mockRunProgress = setTimeout(() => {
      const run = require("./test-fixtures/read-run.json");
      // Lets modify the status of the run to "applied" as to
      // mimic run success in TFC
      run["data"]["attributes"]["status"] = "applied";

      // Update the existing endpoint mock to return the updated
      // run object
      mockRunner.tfeClient.adapter
        .onGet(
          `https://app.terraform.io/api/v2/runs/${mockRunner.tfeClient.defaultRunID}`
        )
        .replyOnce(200, run);
    }, 5000);

    mockRunner.runner
      .createRun(mockRunner.defaultRunOpts)
      .then(async run => {
        const waitedRun = await mockRunner.runner.waitFor(run);
        expect(waitedRun.data.id).toEqual(mockRunner.tfeClient.defaultRunID);
      })
      .catch(err => {
        expect(err).toBeNull();
      })
      .finally(() => {
        clearTimeout(mockRunProgress);
      });

    for (let i = 0; i < 15; i++) {
      jest.advanceTimersByTime(1000);
      // Flush out any pending promises
      await Promise.resolve();
    }
  });

  test("creates run and waits, but run errors", async () => {
    const mockRunner = await mockRunnerP;
    const mockRunProgress = setTimeout(() => {
      const run = require("./test-fixtures/read-run.json");
      // Lets modify the status of the run to "errored" as to
      // mimic some run failure in TFC
      run["data"]["attributes"]["status"] = "errored";

      // Update the existing endpoint mock to return the updated
      // run object
      mockRunner.tfeClient.adapter
        .onGet(
          `https://app.terraform.io/api/v2/runs/${mockRunner.tfeClient.defaultRunID}`
        )
        .replyOnce(200, run);
    }, 5000);

    mockRunner.runner
      .createRun(mockRunner.defaultRunOpts)
      .catch(err => {
        expect(err.message).toMatch(
          /run exited unexpectedly with status: errored/
        );
      })
      .finally(() => {
        clearTimeout(mockRunProgress);
      });

    for (let i = 0; i < 15; i++) {
      jest.advanceTimersByTime(1000);
      // Flush out any pending promises
      await Promise.resolve();
    }
  });
});
