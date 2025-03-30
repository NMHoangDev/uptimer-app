// import { IEmailLocals } from "src/interface/notification.interface.js";

import { NotVoid, update } from "lodash";
import {
  IMonitorArgs,
  IMonitorDocument,
} from "../interface/monitor.interface.js";
import {
  getMonitorById,
  updateMonitorStatus,
} from "../services/monitor.service.js";
import { encodeBase64 } from "../utils/utils.js";
import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import { IHeartBeat } from "../interface/heartbeat.interface.js";
import dayjs from "dayjs";
import { request } from "express";
import { createHttpHeartBeat } from "../services/http.service.js";
import logger from "../server/logger.js";

class HttpMonitor {
  errorCount: number;
  noSuccessAlert: boolean;
  // emailsLocals: IEmailLocals;

  constructor() {
    this.errorCount = 0;
    // this.emailsLocals = ;
    this.noSuccessAlert = true;
  }

  async start(data: IMonitorDocument): Promise<void> {
    const {
      monitorId,
      httpAuthMethod,
      basicAuthUser,
      basicAuthPass,
      url,
      method,
      headers,
      body,
      timeout,
      redirects,
      bearerToken,
    } = data;
    const reqTimeout = timeout! * 1000;
    const startTime: number = Date.now();
    try {
      const monitorData: IMonitorDocument = await getMonitorById(monitorId!);
      // this.emailsLocals.appName = monitorData.name;
      let basicAuthHeader = {};
      if (httpAuthMethod === "basic") {
        basicAuthHeader = {
          Authorization: `Basic ${encodeBase64(
            basicAuthUser!,
            basicAuthPass!
          )}`,
        };
      }
      if (httpAuthMethod === "token") {
        basicAuthHeader = {
          Authorization: `Bearer ${bearerToken}`,
        };
      }

      let bodyValue = null;
      let reqContentType = null;
      if (body && body!.length > 0) {
        try {
          bodyValue = JSON.parse(body!);
          reqContentType = "application/json";
        } catch (error) {
          throw new Error("Your JOSN body is invalid");
        }
      }

      const options: AxiosRequestConfig = {
        url,
        method: (method || "get").toLowerCase(),
        timeout: reqTimeout,
        headers: {
          Accept: "text/html,application/json",
          ...(reqContentType ? { "Content-Type": reqContentType } : {}),
          ...basicAuthHeader,
          ...(headers ? JSON.parse(headers) : {}),
        },
        maxRedirects: redirects,
        ...(bodyValue && {
          data: bodyValue,
        }),
      };
      const response: AxiosResponse = await axios.request(options);
      const responseTime = Date.now() - startTime;
      let heartbeatData: IHeartBeat = {
        monitorId: monitorId!,
        status: 0,
        code: response.status ?? 0,
        message:
          `${response.status} - ${response.statusText}` ||
          "Http monitor check successful.",
        timestamp: dayjs.utc().valueOf(),
        reqHeaders: JSON.stringify(response.headers) ?? "",
        resHeaders: JSON.stringify(response.request.res.rawHeaders) ?? "",
        reqBody: body,
        resBody: JSON.stringify(response.data) ?? "",
        responseTime,
      };
      const statusList = JSON.parse(monitorData.statusCode!);
      const responseDurationTime = JSON.parse(monitorData.responseTime!);
      const contentTypeList =
        monitorData.contentType!.length > 0
          ? JSON.parse(JSON.stringify(monitorData.contentType!))
          : [];
      if (
        !statusList.includes(response.status) ||
        responseDurationTime < responseTime ||
        (contentTypeList.length > 0 &&
          !contentTypeList.includes(response.headers["content-type"]))
      ) {
        heartbeatData = {
          ...heartbeatData,
          status: 1,
          message: "Failed http response assertion",
          code: 500,
        };
        this.errorAssertionCheck(monitorData, heartbeatData);
      } else {
        this.successAssertionCheck(monitorData, heartbeatData);
      }
    } catch (error) {
      const monitorData: IMonitorDocument = await getMonitorById(monitorId!);
      this.httpError(monitorId!, startTime, monitorData, error);
    }
  }
  async errorAssertionCheck(
    monitorData: IMonitorDocument,
    heartbeatData: IHeartBeat
  ): Promise<void> {
    this.errorCount += 1;
    const timestamp = dayjs.utc().valueOf();
    await Promise.all([
      updateMonitorStatus(monitorData, timestamp, "failure"),
      createHttpHeartBeat(heartbeatData),
    ]);
    if (
      monitorData.alertThreshold > 0 &&
      this.errorCount > monitorData.alertThreshold
    ) {
      this.errorCount = 0;
      this.noSuccessAlert = false;
      //TODO: send error email
    }
    logger.info(`HTTP heartbeat failure assertion: ${monitorData.id}`);
  }
  async successAssertionCheck(
    monitorData: IMonitorDocument,
    heartbeatData: IHeartBeat
  ): Promise<void> {
    await Promise.all([
      updateMonitorStatus(monitorData, heartbeatData.timestamp, "success"),
      createHttpHeartBeat(heartbeatData),
    ]);
    if (!this.noSuccessAlert) {
      this.errorCount = 0;
      this.noSuccessAlert = true;
      //TODO: send error email
    }
    logger.info(`HTTP heartbeat success assertion: ${monitorData.id}`);
  }
  async httpError(
    monitorId: number,
    startTime: number,
    monitorData: IMonitorDocument,
    error: any
  ): Promise<void> {
    logger.info(
      `HTTP heartbeat failed: Monitor ID ${monitorData.id || "nothing"}`
    );
    this.errorCount += 1;
    const timestamp = dayjs.utc().valueOf();
    const heartbeatData: IHeartBeat = {
      monitorId: monitorId!,
      status: 1,
      code: error.response ? error.response.status : 500,
      message: error.response
        ? `${error.response.status} - ${error.response.statusText}`
        : "Http monitor error",
      timestamp,
      reqHeaders: error.response ? JSON.stringify(error.response.headers) : "",
      resHeaders: error.response
        ? JSON.stringify(error.response.request.res.rawHeaders)
        : "",
      reqBody: "",
      resBody: error.response ? JSON.stringify(error.response.data) : "",
      responseTime: Date.now() - startTime,
    };
    await Promise.all([
      updateMonitorStatus(monitorData, timestamp, "failure"),
      createHttpHeartBeat(heartbeatData),
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
export const httpMonitor: HttpMonitor = new HttpMonitor();
