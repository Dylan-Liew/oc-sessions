#!/usr/bin/env bun

import { main } from "../dist/cli/index.js";

main().catch((error) => {
  process.stderr.write(`${error.message}\n`);
  process.exit(1);
});
