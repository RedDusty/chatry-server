import { Socket, Server, DefaultEventsMap } from "socket.io";
import { Request } from "express";

export interface IRequestWithUser extends Request {
  user?: string | jwt.JwtPayload;
}

export type socketType = Socket<
  DefaultEventsMap,
  DefaultEventsMap,
  DefaultEventsMap,
  any
>;

export type ioType = Server<
  DefaultEventsMap,
  DefaultEventsMap,
  DefaultEventsMap,
  any
>;
