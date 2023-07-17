/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

import MockAdapter from "axios-mock-adapter";
import { TFEClient, WorkspaceShowResponse } from "./client";

export interface MockTFEClient {
  client: TFEClient;
  adapter: MockAdapter;
  defaultRunID: string;
  defaultWorkspaceID: string;
}

export const newMockTFEClient = (): MockTFEClient => {
  const client = new TFEClient("app.terraform.io", "foobar");
  const adapter = new MockAdapter(Reflect.get(client, "client"));
  const defaultRunID = "run-CZcmD7eagjhyX0vN";
  const defaultWorkspaceID = "ws-noZcaGXsac6aZSJR";

  adapter
    .onPost(`https://app.terraform.io/api/v2/runs`)
    .reply(201, require("./test-fixtures/create-run.json"));

  adapter
    .onGet(
      `https://app.terraform.io/api/v2/organizations/hashicorp/workspaces/foobar`,
    )
    .reply(200, require("./test-fixtures/read-workspace.json"));

  adapter
    .onGet(`https://app.terraform.io/api/v2/runs/${defaultRunID}`)
    .reply(200, require("./test-fixtures/read-run.json"));

  adapter
    .onGet(
      `https://app.terraform.io/api/v2/workspaces/${defaultWorkspaceID}/current-state-version`,
    )
    .reply(200, require("./test-fixtures/read-state-version.json"));

  return {
    client,
    adapter,
    defaultRunID,
    defaultWorkspaceID,
  };
};

describe("TFE Client", () => {
  let mockClient: MockTFEClient;

  beforeAll(() => {
    mockClient = newMockTFEClient();
  });

  test("returns run when run is created", done => {
    mockClient.client
      .createRun({
        isDestroy: false,
        autoApply: true,
        message: "Some message!",
        workspaceID: "ws-foobar1234",
      })
      .then(run => {
        expect(run.data.id).toEqual(mockClient.defaultRunID);
        done();
      });
  });

  test("returns workspace ID when fetched with org name pair", done => {
    const expected = require("./test-fixtures/read-workspace.json");
    mockClient.client.readWorkspace("hashicorp", "foobar").then(workspace => {
      expect(workspace.data.id).toEqual(expected.data.id);
      done();
    });
  });

  test("returns runs status when run is read", done => {
    const expected = require("./test-fixtures/read-run.json");
    // Lets modify the status of the run to "applying"
    expected["data"]["attributes"]["status"] = "applying";

    // Mock a separate endpoint so we don't conflict with the status
    // read from the fixture
    mockClient.adapter
      .onGet(`https://app.terraform.io/api/v2/runs/run-foobar`)
      .reply(200, expected);

    mockClient.client.readRun("run-foobar").then(run => {
      expect(run.data.attributes.status).toEqual("applying");
      done();
    });
  });

  test("returns current state version from workspace", done => {
    const workspace =
      require("./test-fixtures/read-workspace.json") as WorkspaceShowResponse;
    const expected = require("./test-fixtures/read-state-version.json");
    const expectedOutputNames = ["foo", "bar", "foobar"];

    mockClient.client.readCurrentStateVersion(workspace).then(sv => {
      expect(sv.data.id).toEqual(expected.data.id);
      sv.included.forEach(output => {
        expect(sv.included.length).toEqual(expectedOutputNames.length);
        expect(expectedOutputNames).toContain(output.attributes.name);
        expect(output.attributes.value).toBeDefined();
      });
      done();
    });
  });
});
