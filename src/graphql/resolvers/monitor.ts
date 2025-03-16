import { appTimeZone, authenticateGraphQLRoute } from "../../utils/utils.js";
import {
  AppContext,
  IMonitorArgs,
  IMonitorDocument,
} from "../../interface/monitor.interface.js";
import {
  createMonitor,
  deleteSingleMonitor,
  getMonitorById,
  getUserActiveMonitors,
  getUserMonitors,
  toggleMonitor,
  updateSingleMonitor,
} from "../../services/monitor.service.js";
import logger from "../../server/logger.js";
import { startSingleJob, stopSingleBackgroundJob } from "../../utils/jobs.js";
import { getSingleNotificationGroup } from "../../services/notification.service.js";
import pkg from "lodash";
const { toLower } = pkg;

export const MonitorResolver = {
  Query: {
    async getSingleMonitors(
      _: undefined,
      { monitorId }: { monitorId: string },
      contextValue: AppContext
    ) {
      const { req } = contextValue;
      authenticateGraphQLRoute(req);
      const monitor: IMonitorDocument = await getMonitorById(
        parseInt(monitorId!)
      );
      return {
        monitors: [monitor],
      };
    },
    async getUserMonitors(
      _: undefined,
      { userId }: { userId: string },
      contextValue: AppContext
    ) {
      const { req } = contextValue;
      authenticateGraphQLRoute(req);
      const monitors: IMonitorDocument[] = await getUserMonitors(
        parseInt(userId!),
        false
      );
      return {
        monitors: [monitors],
      };
    },
    async autoRefresh(
      _: undefined,
      { userId, refresh }: { userId: string; refresh: boolean },
      contextValue: AppContext
    ) {
      const { req } = contextValue;
      authenticateGraphQLRoute(req);
      if (refresh) {
        req.session = {
          ...req.session,
          enableAutomaticRefresh: true,
        };
        startSingleJob(
          `${toLower(req.currentUser!.name)}`,
          appTimeZone,
          10,
          async () => {
            const monitors: IMonitorDocument[] = await getUserActiveMonitors(
              parseInt(userId!)
            );
            //TODO: publish data to client
            logger.info(monitors[0].name);
          }
        );
      } else {
        req.session = {
          ...req.session,
          enableAutomaticRefresh: false,
        };
        stopSingleBackgroundJob(`${toLower(req.currentUser!.name)}`);
      }
      return refresh;
    },
  },
  Mutation: {
    async createMonitor(
      _: undefined,
      args: IMonitorArgs,
      contextValue: AppContext
    ) {
      try {
        const { req } = contextValue;
        authenticateGraphQLRoute(req);
        const body: IMonitorDocument = args.monitor!;
        const monitor: IMonitorDocument = await createMonitor(body);
        console.log("Monitor", monitor);

        if (body.active && monitor.active) {
          // TODO: start created monitor
          logger.info("Start new monitor");
          startSingleJob("httpJob", appTimeZone, 10, () => {
            logger.info("This is called every 10 seconds");
          });
        }
        return {
          monitors: [monitor],
        };
      } catch (error: any) {
        throw new Error(error);
      }
    },
    async toggleMonitor(
      _: undefined,
      args: IMonitorArgs,
      contextValue: AppContext
    ) {
      try {
        const { req } = contextValue;
        authenticateGraphQLRoute(req);
        const { monitorId, userId, name, active } = args.monitor!;
        const results: IMonitorDocument[] = await toggleMonitor(
          monitorId!,
          userId,
          active as boolean
        );

        if (!active) {
          stopSingleBackgroundJob(name, monitorId!);
        } else {
          //TODO: Add a resume method
          logger.info(`Resume monitor`);
        }
        return {
          monitors: results,
        };
      } catch (error: any) {
        throw new Error(error);
      }
    },
    async updateMonitor(
      _: undefined,
      args: IMonitorArgs,
      contextValue: AppContext
    ) {
      try {
        const { req } = contextValue;
        authenticateGraphQLRoute(req);
        const { monitorId, userId, monitor } = args;
        const monitors: IMonitorDocument[] = await updateSingleMonitor(
          parseInt(`${monitorId}`),
          parseInt(`${userId}`),
          monitor!
        );

        return {
          monitors,
        };
      } catch (error: any) {
        throw new Error(error);
      }
    },
    async deleteMonitor(
      _: undefined,
      args: IMonitorArgs,
      contextValue: AppContext
    ) {
      try {
        const { req } = contextValue;
        authenticateGraphQLRoute(req);
        const { monitorId, userId } = args;
        const monitors: IMonitorDocument[] = await deleteSingleMonitor(
          parseInt(`${monitorId}`),
          parseInt(`${userId}`),
          "http"
        );

        return {
          monitors,
        };
      } catch (error: any) {
        throw new Error(error);
      }
    },
  },
  MonitorResult: {
    lastChanged: (monitor: IMonitorDocument) =>
      JSON.stringify(monitor.lastChanged),
    responseTime: (monitor: IMonitorDocument) => {
      return monitor.responseTime
        ? parseInt(`${monitor.responseTime}`)
        : monitor.responseTime;
    },
    notifications: (monitor: IMonitorDocument) => {
      return getSingleNotificationGroup(monitor.notificationId!);
    },
  },
};
