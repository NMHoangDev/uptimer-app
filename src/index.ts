import express from "express";

async function initializeApp() {
  const { default: MonitorServer } = await import("./server/server.js");
  const app = express();
  const monitorServer = new MonitorServer(app);
  monitorServer.start();
}

initializeApp();
