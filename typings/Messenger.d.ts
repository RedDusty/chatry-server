import { UserShortType } from "@typings/User";

type MessageType = {
  time: number;
  message: string | MessageType;
  images?: string[];
  cid: string;
  existsInDB: boolean;
  editedData?: boolean;
  mid: number;
  user: string | "system";
};

export type ChatMultipleType = {
  cid: string;
  usersUID: string[];
  messagesCount: number;
  existsInDB: boolean;
  editedData: boolean;
  chatType: "private" | "public";
  name: string;
  ownerUID: string;
  avatar: string | null;
};

export type ChatTwoType = {
  cid: string;
  usersUID: string[];
  messagesCount: number;
  chatType: "two-side";
  existsInDB: boolean;
  editedData: boolean;
};

export type ChatType = ChatMultipleType | ChatTwoType

type MessagesType = Map<string, MessageType[]>;
