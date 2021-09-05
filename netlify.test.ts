import * as Lib from "./lib.ts";

const r = await Lib.ensureUniqueDnsRecords(
  "lyte.dev",
  "a",
  "136.32.117.113",
  "2605:a601:add3:0:82e7:6cf2:22a:97de",
);
console.log(r);
