type UserPrivacyType = {
  profile: "public" | "private";
  messages: "all" | "friends";
};

type UserSettingsType = {
  theme: "white" | "dark";
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

type notificationsType = {
  header: notificationsHeaderType;
  data: string | any;
  time: number;
  icon: null | string;
};

export type UserType = {
  username: string;
  email: string;
  uid: string;
  avatar: string | null;
  online: true | number;
  userSettings: UserSettingsType;
  privacy: UserPrivacyType;
  registerDate: number;
  friendsUID: string[];
  ignoresUID: string[];
  waitingsUID: string[];
  subname: string;
  verified: boolean;
  socketID: string | null;
  banned: boolean;
};

export type InfoUserType = {
  ip: string[];
  subname: string;
  password: string;
  uid: string;
  refreshToken: string;
  notifications: number;
};

type ValueOf<T> = T[keyof T];

export type UserShortType = {
  username: string;
  uid: string;
  online: true | number;
  avatar: string | null;
  privacy: UserPrivacyType;
  subname: string;
};
