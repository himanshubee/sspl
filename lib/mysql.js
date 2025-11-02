"use server";

export const runtime = "nodejs";

import mysql from "mysql2/promise";

const host = process.env.MYSQL_HOST;
const user = process.env.MYSQL_USER;
const password = process.env.MYSQL_PASSWORD;
const database = process.env.MYSQL_DATABASE;
const port = process.env.MYSQL_PORT
  ? Number.parseInt(process.env.MYSQL_PORT, 10)
  : 3306;

if (!host || !user || !password || !database) {
  throw new Error(
    "Missing MySQL configuration. Please set MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD, and MYSQL_DATABASE.",
  );
}

let pool;

export function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      host,
      user,
      password,
      database,
      port,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      timezone: "Z",
      dateStrings: false,
    });
  }
  return pool;
}
