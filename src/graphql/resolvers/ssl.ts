import { toLower } from "lodash";
import { AppContext } from "src/interface/monitor.interface.js";
import {
  ISSLMonitorArgs,
  ISSLMonitorDocument,
} from "src/interface/ssl.interface.js";
import { getSingleNotificationGroup } from "src/services/notification.service.js";
import {
  createSSLMonitor,
  deleteSingleSSLMonitor,
  getSSLMonitorById,
  getUserSSLMonitors,
  sslStatusMonitor,
  toggleSSLMonitor,
  updateSingleSSLMonitor,
} from "src/services/ssl.service.js";
import { stopSingleBackgroundJob } from "src/utils/jobs.js";
import {
  authenticateGraphQLRoute,
  resumeSSLMonitors,
} from "src/utils/utils.js";

export const SSLMonitorResolver = {
  Query: {
    async getSingleSSLMonitor(
      _: undefined,
      { monitorId }: { monitorId: string },
      contextValue: AppContext
    ) {
      const { req } = contextValue;
      authenticateGraphQLRoute(req);
      const monitor: ISSLMonitorDocument = await getSSLMonitorById(
        parseInt(monitorId!)
      );
      return {
        sslMonitors: [monitor],
      };
    },
    async getUserSSLMonitors(
      _: undefined,
      { userId }: { userId: string },
      contextValue: AppContext
    ) {
      const { req } = contextValue;
      authenticateGraphQLRoute(req);
      const monitors: ISSLMonitorDocument[] = await getUserSSLMonitors(
        parseInt(userId!)
      );
      return {
        sslMonitors: monitors,
      };
    },
  },
  Mutation: {
    async createSSLMonitor(
      _: undefined,
      args: ISSLMonitorArgs,
      contextValue: AppContext
    ) {
      const { req } = contextValue;
      authenticateGraphQLRoute(req);
      const body: ISSLMonitorDocument = args.monitor!;
      const monitor: ISSLMonitorDocument = await createSSLMonitor(body);
      if (body.active && monitor?.active) {
        sslStatusMonitor(monitor, toLower(body.name));
      }
      return {
        sslMonitors: [monitor],
      };
    },
    async toggleSSLMonitor(
      _: undefined,
      args: ISSLMonitorArgs,
      contextValue: AppContext
    ) {
      const { req } = contextValue;
      authenticateGraphQLRoute(req);
      const { monitorId, userId, name, active } = args.monitor!;
      const sslMonitors: ISSLMonitorDocument[] = await toggleSSLMonitor(
        monitorId!,
        userId,
        active as boolean
      );
      if (!active) {
        stopSingleBackgroundJob(name, monitorId!);
      } else {
        resumeSSLMonitors(monitorId!);
      }
      return {
        sslMonitors,
      };
    },
    async updateSSLMonitor(
      _: undefined,
      args: ISSLMonitorArgs,
      contextValue: AppContext
    ) {
      const { req } = contextValue;
      authenticateGraphQLRoute(req);
      const { monitorId, userId, monitor } = args;
      const sslMonitors: ISSLMonitorDocument[] = await updateSingleSSLMonitor(
        parseInt(`${monitorId}`),
        parseInt(`${userId}`),
        monitor!
      );
      return {
        sslMonitors,
      };
    },
    async deleteSSLMonitor(
      _: undefined,
      args: ISSLMonitorArgs,
      contextValue: AppContext
    ) {
      const { req } = contextValue;
      authenticateGraphQLRoute(req);
      const { monitorId, userId } = args;
      await deleteSingleSSLMonitor(
        parseInt(`${monitorId}`),
        parseInt(`${userId}`)
      );
      return {
        id: parseInt(`${monitorId!}`),
      };
    },
  },
  SSLMonitorResult: {
    notifications: (monitor: ISSLMonitorDocument) => {
      return getSingleNotificationGroup(monitor.notificationId!);
    },
  },
};
