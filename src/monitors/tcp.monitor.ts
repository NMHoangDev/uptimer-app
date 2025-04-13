import {
  IMonitorDocument,
  IMonitorResponse,
} from "../interface/monitor.interface.js";
import {
  getMonitorById,
  updateMonitorStatus,
} from "../services/monitor.service.js";
import dayjs from "dayjs";
import { IHeartBeat } from "../interface/heartbeat.interface.js";
import { createRedisHeartBeat } from "../services/redis.service.js";
import logger from "../server/logger.js";
import { IEmailLocals } from "../interface/notification.interface.js";
// import { emailSender, locals } from '../utils/utils.js';

import { redisPing, tcpPing } from "./monitor.js";
import { createTcpHeartBeat } from "../services/tcp.service.js";
import { emailSender, locals } from "../utils/utils.js";

class TcpMonitor {
  errorCount: number;
  noSuccessAlert: boolean;
  emailsLocals: IEmailLocals;

  constructor() {
    this.errorCount = 0;
    this.noSuccessAlert = true;
    this.emailsLocals = {} as IEmailLocals;
  }

  async start(data: IMonitorDocument) {
    this.emailsLocals = locals();

    const { monitorId, url, port, timeout } = data;
    try {
      const monitorData: IMonitorDocument = await getMonitorById(monitorId!);
      //   this.emailsLocals.appName = monitorData.name;
      const response: IMonitorResponse = await tcpPing(url!, port!, timeout!);

      this.assertionCheck(response, monitorData);
    } catch (error: any) {
      const monitorData: IMonitorDocument = await getMonitorById(monitorId!);
      this.tcpError(monitorData, error);
    }
  }

  async assertionCheck(
    response: IMonitorResponse,
    monitorData: IMonitorDocument
  ) {
    const timestamp = dayjs.utc().valueOf();
    let heartbeatData: IHeartBeat = {
      monitorId: monitorData.id!,
      status: 0,
      code: response.code,
      message: response.message,
      timestamp,
      responseTime: response.responseTime,
      connection: response.status,
    };
    const respTime = JSON.parse(monitorData.responseTime!);
    if (
      monitorData.connection !== response.status ||
      respTime < response.responseTime
    ) {
      this.errorCount += 1;
      heartbeatData = {
        ...heartbeatData,
        status: 1,
        message: "Failed tcp response assertion",
        code: 500,
      };
      await Promise.all([
        updateMonitorStatus(monitorData, timestamp, "failure"),
        createTcpHeartBeat(heartbeatData),
      ]);
      logger.info(
        `TCP heartbeat failed assertions: Monitor ID ${monitorData.id}`
      );
      if (
        monitorData.alertThreshold > 0 &&
        this.errorCount > monitorData.alertThreshold
      ) {
        this.errorCount = 0;
        this.noSuccessAlert = false;
        emailSender(
          monitorData.notifications!.emails,
          "errorStatus",
          this.emailsLocals
        );
      }
    } else {
      await Promise.all([
        updateMonitorStatus(monitorData, timestamp, "success"),
        createTcpHeartBeat(heartbeatData),
      ]);
      logger.info(`TCP heartbeat success: Monitor ID ${monitorData.id}`);
      if (!this.noSuccessAlert) {
        this.errorCount = 0;
        this.noSuccessAlert = true;
        emailSender(
          monitorData.notifications!.emails,
          "successStatus",
          this.emailsLocals
        );
      }
    }
  }

  async tcpError(monitorData: IMonitorDocument, error: IMonitorResponse) {
    this.errorCount += 1;
    const timestamp = dayjs.utc().valueOf();
    const heartbeatData: IHeartBeat = {
      monitorId: monitorData.id!,
      status: 1,
      code: error.code,
      message: error && error.message ? error.message : "TCP heartbeat failed",
      timestamp,
      responseTime: error.responseTime,
      connection: error.status,
    };
    await Promise.all([
      updateMonitorStatus(monitorData, timestamp, "failure"),
      createTcpHeartBeat(heartbeatData),
    ]);
    logger.info(`TCP heartbeat failed: Monitor ID ${monitorData.id}`);
    if (
      monitorData.alertThreshold > 0 &&
      this.errorCount > monitorData.alertThreshold
    ) {
      this.errorCount = 0;
      this.noSuccessAlert = false;
      emailSender(
        monitorData.notifications!.emails,
        'errorStatus',
        this.emailsLocals
      );
    }
  }
}

export const tcpMonitor: TcpMonitor = new TcpMonitor();
