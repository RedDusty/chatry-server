import { editInfoUser } from "@database/handlers/UserHandler";
import { UserType } from "@typings/User";
import jwt from "jsonwebtoken";

export async function createToken(user: UserType, uid: string) {
  const token = jwt.sign(
    {
      ...user,
    },
    uid,
    { expiresIn: 1000 * 60 * 60 * 24 }
  );

  return token;
}

export async function createRefreshToken(
  user: UserType,
  uid: string,
  editInDB?: boolean
) {
  const refreshToken = jwt.sign(
    {
      ...user,
    },
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

    return decodedToken as UserType;
  } catch (error) {
    return null;
  }
}
