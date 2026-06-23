import assert from "node:assert/strict";
import test from "node:test";

import { parseBootstrapOwnerRpcResult } from "./bootstrapOwner";

test("accepts bootstrap_owner result with null handle", () => {
  assert.deepEqual(
    parseBootstrapOwnerRpcResult({
      organization_id: "org-1",
      handle: null,
    }),
    {
      ok: true,
      organizationId: "org-1",
      handle: null,
    }
  );
});

test("parses first bootstrap_owner row when RPC returns an array", () => {
  assert.deepEqual(
    parseBootstrapOwnerRpcResult([
      {
        organization_id: "org-1",
        handle: "shop",
      },
    ]),
    {
      ok: true,
      organizationId: "org-1",
      handle: "shop",
    }
  );
});

test("returns an error when bootstrap_owner returns empty data", () => {
  assert.deepEqual(parseBootstrapOwnerRpcResult(null), {
    ok: false,
    error: "bootstrap_owner returned empty result",
  });
  assert.deepEqual(parseBootstrapOwnerRpcResult([]), {
    ok: false,
    error: "bootstrap_owner returned empty result",
  });
});

test("returns an error when bootstrap_owner omits organization_id", () => {
  assert.deepEqual(parseBootstrapOwnerRpcResult({ handle: "shop" }), {
    ok: false,
    error: "bootstrap_owner returned no organization_id",
  });
});
