import { Model, Op } from "sequelize";
import { IHeartBeat } from "../interface/heartbeat.interface.js";
import { HttpModel } from "../models/http.model.js";
import dayjs from "dayjs";
import { IMonitorDocument } from "../interface/monitor.interface.js";
import { startSingleJob } from "../utils/jobs.js";
import { appTimeZone } from "../utils/utils.js";
import { httpMonitor } from "../monitors/http.monitor.js";

export const createHttpHeartBeat = async (
  data: IHeartBeat
): Promise<IHeartBeat> => {
  try {
    console.log("Heartbeat data:", data);
    const result: Model = await HttpModel.create(data);
    return result.dataValues;
  } catch (error: any) {
    throw new Error(error);
  }
};
export const getHttpHeartBeatsByDuration = async (
  monitorId: number,
  duration: number = 24
): Promise<IHeartBeat[]> => {
  try {
    const fromTimestamp = dayjs.utc().subtract(duration, "hour").valueOf();
    const heartbeats: IHeartBeat[] = (await HttpModel.findAll({
      raw: true,
      where: {
        [Op.and]: [
          { monitorId },
          {
            timestamp: {
              [Op.gte]: fromTimestamp,
            },
          },
        ],
      },
      order: [["timestamp", "DESC"]],
    })) as unknown as IHeartBeat[];
    if (heartbeats == null) {
      return [];
    } else {
      return heartbeats;
    }
  } catch (error: any) {
    throw new Error(error);
  }
};
export const httpStatusMonitor = async (
  monitor: IMonitorDocument,
  name: string
) => {
  const httpMonitorData: IMonitorDocument = {
    monitorId: monitor.id,
    httpAuthMethod: monitor.httpAuthMethod,
    basicAuthUser: monitor.basicAuthUser,
    basicAuthPass: monitor.basicAuthPass,
    url: monitor.url,
    method: monitor.method,
    headers: monitor.headers,
    body: monitor.body,
    timeout: monitor.timeout,
    redirects: monitor.redirects,
    bearerToken: monitor.bearerToken,
  } as IMonitorDocument;
  startSingleJob(name, appTimeZone, monitor.frequency, async () =>
    httpMonitor.start(httpMonitorData)
  );
};
