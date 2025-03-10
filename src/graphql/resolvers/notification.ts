import { authenticateGraphQLRoute } from "../../utils/utils.js";
import { AppContext } from "../../server/server.js";
import {
  createNotificationGroup,
  getAllNotificationGroups,
} from "../../services/notification.service.js";
import logger from "../../server/logger.js";
import { INotificationDocument } from "src/interface/notification.interface.js";

export const NotificationResolver = {
  Query: {
    async getUserNotificationGroups(
      _: undefined,
      { userId }: { userId: string },
      contextValue: AppContext
    ) {
      const { req } = contextValue;
      await authenticateGraphQLRoute(req);
      const notifications = await getAllNotificationGroups(parseInt(userId));
      logger.info("Notifications:", notifications);
      return {
        notifications: notifications,
      };
    },
  },
  Mutation: {
    async createNotificationGroup(
      _: undefined,
      args: { group: INotificationDocument },
      contextValue: AppContext
    ) {
      const { req } = contextValue;
      await authenticateGraphQLRoute(req);
      logger.info("Notification:", args.group!);
      const notification: INotificationDocument = await createNotificationGroup(
        args.group!
      );

      return {
        notifications: [notification],
      };
    },
  },
};
