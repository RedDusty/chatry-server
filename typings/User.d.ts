type UserSettingsType = {
  theme: "white" | "dark";
};

type notificationsType = {
  header: string;
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
  registerDate: number;
  friendsUID: string[];
  ignoresUID: string[];
  waitingsUID: string[];
  subname: string;
  verified: boolean;
  socketID?: string;
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

export type UserShortType = {
  username: string;
  uid: string;
  online: true | number;
  avatar: string | null;
};
