type UserSettingsType = {
  theme: "white" | "dark";
};

type tokensType = {
  accessToken: string;
  refreshToken: string;
};

type notificationsType = {
  header: string;
  data: string;
  time: number;
};

export type UserType = {
  displayName: string;
  email: string;
  uid: string | null;
  avatar: string | null;
  online: true | number;
  userSettings: UserSettingsType;
  tokens: tokensType;
  registerDate: number;
  friendsUID: string[];
  subname: string;
  verified: boolean;
  socketID?: string;
};

export type InfoUserType = {
  ip: string[];
};

export type UserShortType = {
  displayName: string;
  uid: string;
  online: true | number;
  avatar: string | null;
};
