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

export const expressRoutes = express.Router();

expressRoutes.post("/api/login", userLogin);
expressRoutes.post("/api/register", userRegister);
expressRoutes.post("/api/refresh", tokenVerify, tokenRefresh);
expressRoutes.post("/api/logout", tokenVerify, userLogout);

expressRoutes.post("/api/avatar", tokenVerify, userAvatar);

expressRoutes.get("/api/user", getUserProfile);

expressRoutes.post("/api/search/users", searchUser);

expressRoutes.get("/api/notifications", tokenVerify, getNotifications);

export const socketRoutes = (socket: socketType) => {
  socket.on("FRIEND_REQUEST", (data: any) => friendRequest(data));
};
