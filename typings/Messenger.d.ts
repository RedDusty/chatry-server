import { UserShortType } from "@typings/User";

type MessageFileType = string | File;

type MessageType = {
  id?: string;
  time: number;
  message: string | MessageType;
  files?: MessageFileType[];
  chatID: string;
  existsInDB: boolean;
  editedData?: boolean;
  user: UserShortType | "system";
};

export type ChatType = {
  id: string;
  usersUID: string[];
  messagesCount: number;
  existsInDB: boolean;
  editedData: boolean;
  chatType: "private" | "public" | "two-side";
  name: string;
  ownerUID: string;
};

type MessagesType = Map<string, MessageType[]>;
