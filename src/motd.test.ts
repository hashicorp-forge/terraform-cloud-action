import * as core from "@actions/core";
import { setupMOTD } from "./motd";

describe("motd", () => {
  let inputSpy: jest.SpyInstance;
  let logSpy: jest.SpyInstance;

  let inputs: any;
  let motd: () => void;

  beforeEach(async () => {
    inputs = {};
    motd = await setupMOTD();

    inputSpy = jest.spyOn(core, "getInput");
    inputSpy.mockImplementation(name => inputs[name]);

    logSpy = jest.spyOn(core, "info");
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it("prints the given motd", async () => {
    inputs.motd =
      "The repository was forthwith dragooned into a weltering shambles.";
    motd();
    expect(logSpy).toHaveBeenCalledWith(inputs.motd);
  });
});
