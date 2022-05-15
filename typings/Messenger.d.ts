import { UserShortType } from "@typings/User";

type MessageFileType = string | File;

type MessageType = {
  time: number;
  message: string | MessageType;
  files?: MessageFileType[];
  cid: string;
  existsInDB: boolean;
  editedData?: boolean;
  mid: number;
  user: UserShortType | "system";
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
  users: UserShortType[];
  usersUID: string[];
  messagesCount: number;
  chatType: "two-side";
  existsInDB: boolean;
  editedData: boolean;
};

export type ChatType = ChatMultipleType | ChatTwoType

type MessagesType = Map<string, MessageType[]>;
