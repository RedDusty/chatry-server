require("module-alias/register");
import cors from "cors";
import "dotenv/config";
import express from "express";
import http from "http";
import { expressRoutes } from "@utils/routes";
import cookieParser from "cookie-parser";
import expressFileupload from "express-fileupload";
import { Server } from "socket.io";
import csrf from "csurf";
import {
  addOnlineUser,
  friendAccept,
  friendRequest,
  removeOnlineUser,
} from "@database/handlers/UserHandler";
import {
  createChat,
  inviteUserChat,
  sendMessage,
} from "@database/handlers/MessengerHandler";

const PORT = Number(process.env.PORT || 8000);

const app = express();

const corsConfig = {
  origin: process.env.clientURL,
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

const csrfProtection = csrf({
  cookie: {
    httpOnly: true,
  },
});

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
// app.use(csrfProtection);
// app.all("*", (req, res, next) => {
//   res.locals._csrf = req.csrfToken();
//   next();
// });
app.use(expressRoutes);

const server = http.createServer(app);

export const io = new Server(server, {
  cors: corsConfig,
});

io.on("connection", (socket) => {
  socket.on("FRIEND_REQUEST", friendRequest);
  socket.on("FRIEND_ACCEPT", friendAccept);
  socket.on("MESSAGE_SEND", sendMessage);
  socket.on("CREATE_CHAT", createChat);
  socket.on("INVITE_CHAT", inviteUserChat);
  socket.on("USER_CONNECT", (userUID) => {
    console.log(`[user_connect] - ${userUID} /// ${socket.id}`);
    addOnlineUser(userUID, socket.id);
  });
  socket.on("disconnect", (reason) => {
    console.log(`[user_disconnect] - ${socket.id}`);
    removeOnlineUser(socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`[server]: Server running at ${PORT} port`);
});
