import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";
import test from "node:test";

const migration = readFileSync(
  fileURLToPath(new URL("../migrations/0023_admin_setup_guard.sql", import.meta.url)),
  "utf8"
);

function database() {
  const db = new DatabaseSync(":memory:");
  db.exec(`
    CREATE TABLE admin_users (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      email TEXT NOT NULL UNIQUE COLLATE NOCASE,
      password_salt TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      password_iterations INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      last_login_at TEXT
    );
  `);
  db.exec(migration);
  return db;
}

test("blocks first-admin creation without a short-lived owner authorization", () => {
  const db = database();
  assert.throws(
    () => db.prepare("INSERT INTO admin_users(id,email,password_salt,password_hash,password_iterations) VALUES(1,?,?,?,?)")
      .run("owner@example.invalid", "salt", "hash", 100000),
    /admin setup authorization required/
  );
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM admin_users").get().n, 0);
  db.close();
});

test("allows the authorized setup batch and consumes the authorization row", () => {
  const db = database();
  db.exec("BEGIN");
  db.prepare("INSERT INTO admin_setup_authorizations(id,expires_at) VALUES(1,datetime('now','+1 minute'))").run();
  db.prepare("INSERT INTO admin_users(id,email,password_salt,password_hash,password_iterations) VALUES(1,?,?,?,?)")
    .run("owner@example.invalid", "salt", "hash", 100000);
  db.prepare("DELETE FROM admin_setup_authorizations WHERE id=1").run();
  db.exec("COMMIT");
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM admin_users").get().n, 1);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM admin_setup_authorizations").get().n, 0);
  db.close();
});

test("rejects an expired setup authorization", () => {
  const db = database();
  db.prepare("INSERT INTO admin_setup_authorizations(id,expires_at) VALUES(1,datetime('now','-1 minute'))").run();
  assert.throws(
    () => db.prepare("INSERT INTO admin_users(id,email,password_salt,password_hash,password_iterations) VALUES(1,?,?,?,?)")
      .run("expired@example.invalid", "salt", "hash", 100000),
    /admin setup authorization required/
  );
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM admin_users").get().n, 0);
  db.close();
});
