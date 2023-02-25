import * as core from "@actions/core";

import { setupMOTD } from "./motd";

(async () => {
  try {
    await setupMOTD();
  } catch (error) {
    core.setFailed(error.message);
  }
})();
