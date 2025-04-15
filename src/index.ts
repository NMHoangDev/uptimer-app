import express from "express";
import { databaseConnection } from "./server/database.js";
import "./models/index.model.js";

const initializeApp = async () => {
  const { default: MonitorServer } = await import("./server/server.js");
  const app = express();

  const monitorServer = new MonitorServer(app);

  await databaseConnection().then(() => {
    monitorServer.start();
  });
};

initializeApp();
