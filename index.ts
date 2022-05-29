import cors from "cors";
import "dotenv/config";
import express from "express";
import http from "http";
import cookieParser from "cookie-parser";
import expressFileupload from "express-fileupload";
import { Server } from "socket.io";
import { expressRoutes, socketRoutes } from "@utils/routes";
import {
  addOnlineUser,
  removeOnlineUser,
} from "@database/handlers/onlineUsers";
import { updater } from "@database/cache";

const PORT = Number(process.env.PORT || 8000);

const app = express();

const corsConfig = {
  origin: process.env.clientURL,
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

app.use(cors(corsConfig));
app.use(
  expressFileupload({
    limits: {
      fileSize: 8388608,
      files: 10,
    },
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(expressRoutes);

const server = http.createServer(app);

export const io = new Server(server, {
  cors: corsConfig,
  maxHttpBufferSize: 5e6,
});

io.on("connection", (socket) => {
  socketRoutes(socket);
  socket.on("USER_CONNECT", (userUID) => {
    console.log(`[user_connect] - ${userUID} /// ${socket.id}`);
    addOnlineUser(userUID, socket.id);
  });
  socket.on("disconnect", (reason) => {
    console.log("[error] - " + reason);
    if (reason !== "transport error") {
      removeOnlineUser(socket.id);
    }
  });
});

server.listen(PORT, () => {
  console.log(`[server]: Server running at ${PORT} port`);
});

const shedulerUpdateDB = () => {
  setTimeout(() => {
    updater();
    console.log(
      "[updated]: next - " +
        new Date(new Date().getTime() + 1000 * 60 * 5).toLocaleString()
    );

    shedulerUpdateDB();
  }, 1000 * 60 * 5);
};

console.log(
  "[updated]: first - " +
    new Date(new Date().getTime() + 1000 * 60 * 5).toLocaleString()
);
shedulerUpdateDB();
