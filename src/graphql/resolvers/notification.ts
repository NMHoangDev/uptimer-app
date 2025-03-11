import { authenticateGraphQLRoute } from "../../utils/utils.js";
import { AppContext } from "../../server/server.js";
import {
  createNotificationGroup,
  deleteNotificationGroup,
  getAllNotificationGroups,
  updateNotificationGroup,
} from "../../services/notification.service.js";
import logger from "../../server/logger.js";
import { INotificationDocument } from "../../interface/notification.interface.js";

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
    async updateNotificationGroup(
      _: undefined,
      args: { notificationId: string; group: INotificationDocument },
      contextValue: AppContext
    ) {
      const { req } = contextValue;
      await authenticateGraphQLRoute(req);

      const { notificationId, group } = args;
      await updateNotificationGroup(parseInt(notificationId), group);
      const notification = {
        ...group,
        id: parseInt(notificationId),
      };
      return {
        notifications: [notification],
      };
    },
    async deleteNotificationGroup(
      _: undefined,
      args: { notificationId: string },
      contextValue: AppContext
    ) {
      const { req } = contextValue;
      await authenticateGraphQLRoute(req);

      const { notificationId } = args;
      await deleteNotificationGroup(parseInt(notificationId));

      return {
        notificationID: notificationId,
      };
    },
  },
};
