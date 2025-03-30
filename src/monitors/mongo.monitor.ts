import dayjs from "dayjs";
import { IHeartBeat } from "../interface/heartbeat.interface.js";
import {
  IMonitorDocument,
  IMonitorResponse,
} from "../interface/monitor.interface.js";
import logger from "../server/logger.js";
import {
  getMonitorById,
  updateMonitorStatus,
} from "../services/monitor.service.js";
import { mongodbPing } from "./monitor.js";
import { createMongoHeartBeat } from "../services/mongo.service.js";

class MongoMonitor {
  errorCount: number;
  noSuccessAlert: boolean;
  // emailsLocals: IEmailLocals;

  constructor() {
    this.errorCount = 0;
    this.noSuccessAlert = true;
    //   this.emailsLocals = locals();
  }

  async start(data: IMonitorDocument): Promise<void> {
    const { monitorId, url } = data;
    try {
      const monitorData: IMonitorDocument = await getMonitorById(monitorId!);
      // this.emailsLocals.appName = monitorData.name;
      const response: IMonitorResponse = await mongodbPing(url!);
      if (monitorData.connection !== response.status) {
        this.errorAssertionCheck(response.responseTime, monitorData);
      } else {
        this.successAssertionCheck(response, monitorData);
      }
    } catch (error: any) {
      const monitorData: IMonitorDocument = await getMonitorById(monitorId!);
      this.mongoDBError(monitorData, error);
    }
  }

  async errorAssertionCheck(
    responseTime: number,
    monitorData: IMonitorDocument
  ): Promise<void> {
    this.errorCount += 1;
    const timestamp = dayjs.utc().valueOf();
    const heartbeatData: IHeartBeat = {
      monitorId: monitorData.id!,
      status: 1,
      code: 500,
      message: "Connection status incorrect",
      timestamp,
      responseTime,
      connection: "refused",
    };
    await Promise.all([
      updateMonitorStatus(monitorData, timestamp, "failure"),
      createMongoHeartBeat(heartbeatData),
    ]);
    if (
      monitorData.alertThreshold > 0 &&
      this.errorCount > monitorData.alertThreshold
    ) {
      this.errorCount = 0;
      this.noSuccessAlert = false;
      //TODO: send error email
      // emailSender(
      //   monitorData.notifications!.emails,
      //   'errorStatus',
      //   this.emailsLocals
      // );
    }
    logger.info(
      `MONGODB heartbeat failed assertions: Monitor ID ${monitorData.id}`
    );
  }

  async successAssertionCheck(
    response: IMonitorResponse,
    monitorData: IMonitorDocument
  ): Promise<void> {
    const heartbeatData: IHeartBeat = {
      monitorId: monitorData.id!,
      status: 0,
      code: response.code,
      message: response.message,
      timestamp: dayjs.utc().valueOf(),
      responseTime: response.responseTime,
      connection: response.status,
    };
    await Promise.all([
      updateMonitorStatus(monitorData, heartbeatData.timestamp, "success"),
      createMongoHeartBeat(heartbeatData),
    ]);
    if (!this.noSuccessAlert) {
      this.errorCount = 0;
      this.noSuccessAlert = true;
      //TODO: send email error
      // emailSender(
      //   monitorData.notifications!.emails,
      //   'successStatus',
      //   this.emailsLocals
      // );
    }
    logger.info(`MONGODB heartbeat success: Monitor ID ${monitorData.id}`);
  }

  async mongoDBError(
    monitorData: IMonitorDocument,
    error: IMonitorResponse
  ): Promise<void> {
    logger.info(`MONGODB heartbeat failed: Monitor ID ${monitorData.id}`);
    this.errorCount += 1;
    const timestamp = dayjs.utc().valueOf();
    const heartbeatData: IHeartBeat = {
      monitorId: monitorData.id!,
      status: 1,
      code: error.code,
      message: error.message ?? "MongoDB connection failed",
      timestamp,
      responseTime: error.responseTime,
      connection: error.status,
    };
    await Promise.all([
      updateMonitorStatus(monitorData, timestamp, "failure"),
      createMongoHeartBeat(heartbeatData),
    ]);
    if (
      monitorData.alertThreshold > 0 &&
      this.errorCount > monitorData.alertThreshold
    ) {
      this.errorCount = 0;
      this.noSuccessAlert = false;
      //TODO: send email error
    }
  }
}

export const mongoMonitor: MongoMonitor = new MongoMonitor();
