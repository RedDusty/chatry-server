import { editInfoUser } from "@database/handlers/UserHandler";
import { UserTypeClient, UserTypeServer } from "@typings/User";
import { tokenType } from "custom";
import jwt from "jsonwebtoken";

export async function createToken(
  user: UserTypeClient | UserTypeServer,
  uid: string
) {
  const token = jwt.sign(
    {
      username: user.username,
      uid: user.uid,
      avatar: user.avatar,
      email: user.email,
      registerDate: user.registerDate,
      verified: user.verified,
      banned: user.banned,
      subname: String(user.username).toLowerCase(),
    } as tokenType,
    uid,
    { expiresIn: 1000 * 60 * 60 * 24 }
  );

  return token;
}

export async function createRefreshToken(
  user: UserTypeClient | UserTypeServer,
  uid: string,
  editInDB?: boolean
) {
  const refreshToken = jwt.sign(
    {
      username: user.username,
      uid: user.uid,
      avatar: user.avatar,
      email: user.email,
      registerDate: user.registerDate,
      verified: user.verified,
      banned: user.banned,
      subname: String(user.username).toLowerCase(),
    } as tokenType,
    uid + "refresh"
  );

  if (editInDB === true) {
    await editInfoUser(uid, "refreshToken", refreshToken);
  }

  return refreshToken;
}

export async function verifyToken(token: string, uid: string) {
  try {
    const decodedToken = jwt.verify(token, uid);

    return decodedToken as tokenType;
  } catch (error) {
    return null;
  }
}
