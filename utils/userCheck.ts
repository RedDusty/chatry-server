import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";

export default async function userCheck(req: Request, res: Response) {
  const accessToken: string = String(req.headers.authorization) as string;

  console.log('access token');
  

  try {
    const token = jwt.decode(accessToken) as any;

    const email = token.email;
    const password = token.password;

    console.log('token');
    

    try {
      const userCred = await signInWithEmailAndPassword(
        getAuth(),
        email,
        password
      );

      const userUID = userCred.user.uid;

      console.log('userUID');
      

      return userUID;
    } catch (error) {

      console.log('catch 1');
      
      return null;
    }
  } catch (error) {

    console.log('catch 2');
    
    return null;
  }
}
