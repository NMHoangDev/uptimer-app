import { buildSchema } from "graphql";

export const monitorSchema = buildSchema(`#graphql
    input Monitor {
        id: Int
        monitorId: Int
        notificationId: Int!
        name: String!
        active: Boolean
        status: Int
        userId: Int!
        frequency: Int
        alertThreshold: Int
        url: String!
        type: String!
        lastChanged: String
        timeout: Int
        uptime: Int
        redirects: Int
        method: String
        headers: String
        body: String
        httpAuthMethod: String
        basicAuthUser: String
        basicAuthPass: String
        bearerToken: String
        contentType: String
        statusCode: String
        responseTime: String
        connection: String
        port: Int
        heartbeats: [HeartBeatInput]
        notifications: [NotificationResultInput]
    }
    input HeartBeatInput {
        id: ID
        monitor_id: Int
        status: Int
        code: Int
        message: String
        timestamp: String
        reqHeaders: String
        resHeaders: String
        responseTime: Int
        resBody: String
        connection: String
    }

    input NotificationResultInput {
        id: ID!
        userId: ID!
        groupName: String!
        emails: String!
    }

    # Chuyển từ input thành type
    type HeartBeat {
    id: ID
    monitor_id: Int
    status: Int
    code: Int
    message: String
    timestamp: String
    reqHeaders: String
    resHeaders: String
    responseTime: Int
    resBody: String
    connection: String
    }
    

    type NotificationResult {
    id: ID!
    userId: ID!
    groupName: String!
    emails: String!
    }

    type MonitorResult {
        id: Int
        monitorId: Int
        notificationId: Int
        name: String!
        active: Boolean
        status: Int
        userId: Int!
        frequency: Int
        alertThreshold: Int
        url: String!
        type: String!
        lastChanged: String
        timeout: Int
        uptime: Int
        redirects: Int
        method: String
        headers: String
        body: String
        httpAuthMethod: String
        basicAuthUser: String
        basicAuthPass: String
        bearerToken: String
        contentType: String
        statusCode: String
        responseTime: String
        connection: String
        port: Int
        heartbeats: [HeartBeat]  # Đã sửa thành type HeartBeat
        notifications: [NotificationResult]  # Đã sửa thành type NotificationResult
    }

    input ToggleMonitor {
        monitorId: Int!
        userId: Int!
        name: String!
        active: Boolean
    }

    type MonitorResponse {
        userId: Int
        monitors: [MonitorResult!]
    }

    type DeleteMonitorResponse {
        id: ID!
    }

    type AutoRefresh {
        refresh: Boolean
    }

    type AuthResponse {
        userId: Int!
        notifications: [NotificationResult!]!  # Đã sửa thành type NotificationResult
    }

    type CurrentUserResponse {
        userId: Int!
        notifications: [NotificationResult!]!  # Đã sửa thành type NotificationResult
    }

    type NotificationResponse {
        notifications: [NotificationResult]!  # Đã sửa thành type NotificationResult
    }

    type Query {
        getSingleMonitors(monitorId: Int!): MonitorResponse
        getUserMonitors(userId: Int!): MonitorResponse
        AutoRefresh(userId: Int!, refresh: Boolean!): AutoRefresh
    }

    type Mutation {
        createMonitor(monitor: Monitor!): MonitorResponse
        toggleMonitor(monitor: ToggleMonitor!): MonitorResponse
        updateMonitor(monitorId: Int!, userId: Int!, monitor: Monitor!): MonitorResponse
        deleteMonitor(monitorId: Int!, userId: Int!): DeleteMonitorResponse
        setAutoRefresh(userId: Int!, refresh: Boolean!): AutoRefresh
    }
`);
