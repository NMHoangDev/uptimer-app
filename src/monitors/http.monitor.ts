// import { IEmailLocals } from "src/interface/notification.interface.js";

import { NotVoid } from "lodash";
import {
  IMonitorArgs,
  IMonitorDocument,
} from "../interface/monitor.interface.js";
import { getMonitorById } from "../services/monitor.service.js";
import { encodeBase64 } from "../utils/utils.js";

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
      const monitorData: IMonitorDocument = await getMonitorById(monitorId);
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
      if (body!.length > 0) {
        try {
          bodyValue = JSON.parse(body!);
          reqContentType = "application/json";
        } catch (error: any) {
          throw new Error("Your Json body is invalid: " + error.message);
        }
      }
      const options: AxiosRequestConfig = {
        url,
        method: (method || "get").toLowerCase(),
        timeout: reqTimeout,
        headers: {
          Accept: "text/html,application/json",
          ...reqContentType(reqContentType ? {"Content-Type": reqContentType} : {}),
          ...basicAuthHeader,
          ...(headers ? JSON.parse(headers) : {})
        },
        maxRedirects: redirects
      };
    
    } catch (error) {
      throw new Error("Error");
    }
  }
}
export const httpMonitor: HttpMonitor = new HttpMonitor();
