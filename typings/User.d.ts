type UserPrivacyType = {
  profile: "public" | "private" | "friends";
  twoside: "all" | "friends";
};

type notificationsHeaderFriendType =
  | "FRIEND_REQUEST_ADD"
  | "FRIEND_REQUEST_ACCEPT"
  | "FRIEND_REQUEST_DECLINE"
  | "FRIEND_REMOVE";

type notificationsHeaderType =
  | notificationsHeaderFriendType
  | "ACCOUNT_REGISTER"
  | "CHAT_INVITE";

type notificationsTypeClient = {
  header: notificationsHeaderType;
  data: string | any;
  time: number;
  icon?: null | string;
  user?: {
    username: string;
    uid: string;
  };
};

type notificationsTypeServer = {
  header: notificationsHeaderType;
  data?: string | any;
  time: number;
  icon?: null | string;
  userUID?: string;
};

export type UserTypeServer = {
  username: string;
  subname: string;
  email: string;
  uid: string;
  avatar: string | null;
  online: boolean | number;
  privacy: UserPrivacyType;
  registerDate: number;
  friendsUID: string[];
  ignoresUID: string[];
  waitingsUID: string[];
  verified: boolean;
  socketID: string | null;
  banned: boolean;
  lastUsernameUpdate: number;
  editedData: boolean;
};

export type UserTypeClient = {
  username: string;
  email: string;
  uid: string | null;
  avatar: string | null;
  online: boolean | number;
  privacy: UserPrivacyType;
  registerDate: number;
  friendsUID: string[];
  ignoresUID: string[];
  waitingsUID: string[];
  verified: boolean;
  socketID: string | null;
  banned: boolean;
  lastUsernameUpdate: number;
};

export type InfoUserType = {
  ip: string[];
  password: string;
  uid: string;
  refreshToken: string;
  notifications: number;
  subname: string;
};

type ValueOf<T> = T[keyof T];


export type lastUsernamesType = {
  updateTime: number;
  username: string;
};

export type UserShortType = {
  username: string;
  uid: string;
  online: boolean | number;
  avatar: string | null;
  privacy: UserPrivacyType;
  usernames?: lastUsernamesType[]
};
