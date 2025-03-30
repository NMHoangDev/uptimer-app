import lodash from "lodash";
import { Model } from "sequelize";
import { INotificationDocument } from "../interface/notification.interface.js";
import { NotificationModel } from "../models/notification.model.js";

const { omit } = lodash;

export async function createNotificationGroup(
  data: INotificationDocument
): Promise<INotificationDocument> {
  try {
    console.log("Data: ", data);

    const result: Model = await NotificationModel.create(data);

    const userData: INotificationDocument = omit(result.dataValues, [
      "password",
    ]) as INotificationDocument;
    return userData;
  } catch (error: any) {
    throw new Error(error);
  }
}
export async function getSingleNotificationGroup(
  notificationId: number
): Promise<INotificationDocument | undefined> {
  try {
    const notifications: INotificationDocument =
      (await NotificationModel.findOne({
        raw: true,
        where: {
          id: notificationId,
        },
        order: [["createdAt", "DESC"]],
      })) as unknown as INotificationDocument;
    return;
  } catch (error: any) {
    throw new Error(error);
  }
}
export async function getAllNotificationGroups(
  userId: number
): Promise<INotificationDocument[]> {
  try {
    const notifications: INotificationDocument[] =
      (await NotificationModel.findAll({
        raw: true,
        where: {
          userId: userId,
        },
        order: [["createdAt", "DESC"]],
      })) as unknown as INotificationDocument[];
    return notifications;
  } catch (error: any) {
    throw new Error(error);
  }
}
export async function updateNotificationGroup(
  notificationId: number,
  data: INotificationDocument
) {
  try {
    await NotificationModel.update(data, {
      where: { id: notificationId },
    });
  } catch (error) {}
}
export async function deleteNotificationGroup(
  notificationId: number
): Promise<void> {
  try {
    await NotificationModel.destroy({
      where: { id: notificationId },
    });
  } catch (error: any) {
    throw new Error(error);
  }
}
