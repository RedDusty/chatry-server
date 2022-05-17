import { Socket, Server, DefaultEventsMap } from "socket.io";
import { Request } from "express";

type tokenType = {
  username: string;
  subname: string;
  uid: string;
  avatar: string | null;
  email: string;
  registerDate: number;
  verified: boolean;
  banned: boolean;
};

export interface IRequestWithUser extends Request {
  user?: tokenType;
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
