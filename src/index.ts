import express from "express";
import { databaseConnection } from "./server/database.js";

async function initializeApp() {
  const { default: MonitorServer } = await import("./server/server.js");
  const app = express();
  const monitorServer = new MonitorServer(app);

  await monitorServer.start();
  await databaseConnection();
}

initializeApp();
