import express, { Request, Response } from "express";
import tokenRefresh from "@handlers/auth/tokenRefresh";
import userAvatar from "@handlers/userAvatar";
import userLogin from "@handlers/auth/userLogin";
import userRegister from "@handlers/auth/userRegister";
import getUserProfile from "@handlers/getUserProfile";
import searchUser from "@handlers/searchUser";
import { socketType } from "custom";
import friendRequest from "@handlers/friend/friendRequest";
import tokenVerify from "./tokenVerify";
import userLogout from "@handlers/auth/userLogout";
import getNotifications from "@handlers/getNotifications";
import getFriends from "@handlers/getFriends";
import messagesGet from "@handlers/messages/messagesGet";
import messagesSend from "@handlers/messages/messagesSend";
import chatCreate from "@handlers/messages/chatCreate";

export const expressRoutes = express.Router();

expressRoutes.post("/api/login", userLogin);
expressRoutes.post("/api/register", userRegister);
expressRoutes.post("/api/refresh", tokenVerify, tokenRefresh);
expressRoutes.post("/api/logout", tokenVerify, userLogout);

expressRoutes.post("/api/avatar", tokenVerify, userAvatar);

expressRoutes.get("/api/user", getUserProfile);

expressRoutes.post("/api/search/users", searchUser);
expressRoutes.post("/api/search/friends", getFriends);

expressRoutes.get("/api/notifications", tokenVerify, getNotifications);

export const socketRoutes = (socket: socketType) => {
  socket.on("FRIEND_REQUEST", (data: any) => friendRequest(data));
  socket.on("MESSAGES_GET", (data: any) => messagesGet(data, socket.id));
  socket.on("MESSAGES_SEND", (data: any) => messagesSend(data, socket.id));
  socket.on("CHAT_SERVER_CREATE", (data: any) => chatCreate(data));
  socket.on("MESSAGE_SEND", (data: any) => messagesSend(data, socket.id));
};
