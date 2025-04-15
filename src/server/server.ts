import express, { json, urlencoded, Request, Response } from "express";
import chalk from "chalk";
import http from "http";
import cors from "cors";
import {
  CLIENT_URL,
  NODE_ENV,
  PORT,
  SECRET_KEY_ONE,
  SECRET_KEY_TWO,
} from "./config.js";
import { ApolloServer, BaseContext } from "@apollo/server";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import { ApolloServerPluginLandingPageDisabled } from "@apollo/server/plugin/disabled";
import { ApolloServerPluginLandingPageLocalDefault } from "@apollo/server/plugin/landingPage/default";

import { expressMiddleware } from "@apollo/server/express4";
import cookieSession from "cookie-session";
import logger from "./logger.js";
import { mergedGQLSchema } from "../graphql/schema/index.js";
import { GraphQLSchema } from "graphql";
import { resolvers } from "../graphql/resolvers/index.js";
import { AppContext } from "../interface/monitor.interface.js";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";
import customFormat from "dayjs/plugin/customParseFormat.js";
import dayjs from "dayjs";
import {
  enableAutoRefreshJob,
  startMonitors,
  startSSLMonitors,
} from "../utils/utils.js";
import { WebSocketServer, Server as WSServer } from "ws";
import { useServer } from "../../node_modules/graphql-ws/dist/use/ws.js";

dayjs.extend(utc);

dayjs.extend(timezone);
dayjs.extend(customFormat);

// Định nghĩa context

export default class MonitorServer {
  private app: express.Application;
  private httpServer: http.Server;
  private server: ApolloServer;
  private wsServer: WSServer;

  constructor(app: express.Application) {
    this.app = app;
    this.httpServer = http.createServer(app);
    this.wsServer = new WebSocketServer({
      server: this.httpServer,
      path: "/graphql",
    });

    // Tạo schema GraphQL
    const schema: GraphQLSchema = makeExecutableSchema({
      typeDefs: mergedGQLSchema,
      resolvers,
    });
    const serverCleanup = useServer(
      {
        schema,
      },
      this.wsServer
    );

    // Khởi tạo ApolloServer
    this.server = new ApolloServer<AppContext | BaseContext>({
      schema,
      introspection: NODE_ENV !== "production",
      plugins: [
        ApolloServerPluginDrainHttpServer({ httpServer: this.httpServer }),
        {
          async serverWillStart() {
            return {
              async drainServer() {
                await serverCleanup.dispose();
              },
            };
          },
        },
        ...(NODE_ENV === "production"
          ? [ApolloServerPluginLandingPageDisabled()]
          : [ApolloServerPluginLandingPageLocalDefault({ embed: true })]),
      ],
    });
  }

  // Phương thức start() gọi đầu tiên
  async start(): Promise<void> {
    await this.server.start();
    this.standardMiddleware(this.app);
    this.graphqlRoute(this.app); // Đăng ký GraphQL sau khi server đã start
    this.webSocketConnection();
    this.startServer(); // Chỉ gọi 1 lần
  }

  // Cài đặt các middleware cần thiết
  private standardMiddleware(app: express.Application): void {
    // Đặt trust proxy nếu deploy sau reverse proxy (Nginx, Heroku, v.v.)
    app.set("trust proxy", 1);

    // Tắt cache
    app.use((req, res, next) => {
      res.header("Cache-Control", "no-cache, no-store, must-revalidate");
      next();
    });

    // Cookie Session
    app.use(
      cookieSession({
        name: "session",
        keys: [SECRET_KEY_ONE, SECRET_KEY_TWO],
        maxAge: 24 * 7 * 3600000,
        secure: NODE_ENV === "production", // true nếu chạy HTTPS
        sameSite: NODE_ENV === "production" ? "none" : "lax",
      })
    );

    // Đăng ký route kiểm tra sức khỏe
    this.healthRoute(app);
  }

  // Đăng ký route /graphql
  private graphqlRoute(app: express.Application): void {
    app.use(
      "/graphql",
      cors({
        origin: CLIENT_URL,
        credentials: true,
      }),
      json({ limit: "200mb" }),
      urlencoded({ extended: true, limit: "200mb" }),
      expressMiddleware(this.server, {
        context: async ({ req, res }: { req?: Request; res?: Response }) => {
          if (!req || !res) {
            throw new Error(
              "⚠ Context không chứa req hoặc res. Kiểm tra middleware!"
            );
          }
          return { req, res };
        },
      })
    );
  }

  // Đăng ký route kiểm tra sức khỏe
  private healthRoute(app: express.Application): void {
    app.get("/health", (_req: Request, res: Response) => {
      res.status(200).send("Uptimer monitor service is healthy and OK.");
    });
  }
  private webSocketConnection() {
    this.wsServer.on(
      "connection",
      (_ws: WebSocket, req: http.IncomingMessage) => {
        if (req.headers && req.headers.cookie) {
          enableAutoRefreshJob(req.headers.cookie);
        } else {
          logger.info("Not have cookie");
        }
      }
    );
  }

  // Lắng nghe server
  private async startServer(): Promise<void> {
    try {
      const SERVER_PORT: number = parseInt(PORT!, 10) || 5000;
      logger.info(`Server has started with process id ${process.pid}`);
      this.httpServer.listen(SERVER_PORT, () => {
        logger.info(
          chalk.green.bold(`Server started with port ${SERVER_PORT}`)
        );
        startMonitors();
        startSSLMonitors();
      });
    } catch (error) {
      logger.error("Error in start method:", error);
    }
  }
}
