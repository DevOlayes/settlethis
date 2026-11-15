import assert from "node:assert/strict";
import test from "node:test";
import { secureUrl } from "../src/url-validation.ts";

test("accepts and normalizes valid HTTPS URLs", () => {
  assert.equal(secureUrl("https://example.com/path"), "https://example.com/path");
  assert.equal(secureUrl(" https://example.com/path "), "https://example.com/path");
  assert.equal(secureUrl("https://example.com:443"), "https://example.com/");
});

test("rejects non-HTTPS and executable URL schemes", () => {
  for (const value of [
    "http://example.com",
    "javascript:alert(1)",
    "data:text/html,<script>alert(1)</script>",
    "file:///etc/passwd",
    "//example.com/path"
  ]) assert.equal(secureUrl(value), null, String(value));
});

test("rejects empty, non-string and malformed URL inputs", () => {
  for (const value of [null, undefined, 123, {}, "", "   ", "https://", "not a URL"]) {
    assert.equal(secureUrl(value), null);
  }
});
