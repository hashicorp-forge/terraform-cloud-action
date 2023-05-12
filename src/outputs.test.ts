/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

import { redactSecrets } from "./outputs";
import { StateVersionOutputData } from "./client";
import * as core from "@actions/core";

describe("redactSecrets", () => {
  let secrets = new Set();
  let secretSpy: jest.SpyInstance;

  beforeEach(() => {
    secretSpy = jest.spyOn(core, "setSecret");
    secretSpy.mockImplementation(v => secrets.add(v));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("redacts values recursively", () => {
    const example: StateVersionOutputData[] = [
      {
        id: "abc",
        type: "StateVersionOutput",
        attributes: {
          name: "example",
          sensitive: true,
          type: "object",
          value: {
            hello: [
              {
                colors: ["red", "green", "blue", false, null],
              },
            ],
            world: "secret",
            foo: {
              bar: "baz",
              fake: null,
            },
          },
        },
      },
    ];

    redactSecrets(example);
    expect(secretSpy).toHaveBeenCalledTimes(5);
    expect(secretSpy).toHaveBeenCalledWith("red");
    expect(secretSpy).toHaveBeenCalledWith("green");
    expect(secretSpy).toHaveBeenCalledWith("blue");
    expect(secretSpy).toHaveBeenCalledWith("secret");
    expect(secretSpy).toHaveBeenCalledWith("baz");
  });

  test("redacts string values", () => {
    const example: StateVersionOutputData[] = [
      {
        id: "abc",
        type: "StateVersionOutput",
        attributes: {
          name: "example",
          sensitive: true,
          type: "object",
          value: "hello",
        },
      },
    ];

    redactSecrets(example);
    expect(secretSpy).toHaveBeenCalledTimes(1);
    expect(secretSpy).toHaveBeenCalledWith("hello");
  });

  test("does not redact non-sensitive outputs", () => {
    const example: StateVersionOutputData[] = [
      {
        id: "abc",
        type: "StateVersionOutput",
        attributes: {
          name: "example",
          sensitive: false,
          type: "object",
          value: "hello",
        },
      },
    ];

    redactSecrets(example);
    expect(secretSpy).toHaveBeenCalledTimes(0);
  });
});
