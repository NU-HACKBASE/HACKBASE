import assert from "node:assert/strict";
import test from "node:test";

import { readEnv, readOptionalEnv } from "./env.js";

test("readEnv reads values from the environment", () => {
  assert.equal(
    readEnv("AUTH_SECRET", undefined, { AUTH_SECRET: "from-env" }),
    "from-env",
  );
});

test("readEnv throws when a required value is missing", () => {
  assert.throws(
    () => readEnv("AUTH_SECRET", undefined, {}),
    /Missing required environment variable: AUTH_SECRET/,
  );
});

test("readOptionalEnv treats blank values as unset", () => {
  assert.equal(
    readOptionalEnv("GOOGLE_AI_API_KEY", { GOOGLE_AI_API_KEY: "   " }),
    undefined,
  );
  assert.equal(
    readOptionalEnv("GOOGLE_AI_API_KEY", { GOOGLE_AI_API_KEY: "key" }),
    "key",
  );
});
