import { Request, Response } from "express";

const tokenRefresh = (req: Request, res: Response) => {
  const token = req.body.token;

  if (!token) return res.status(401).json("You are not authenticated");
};

export default tokenRefresh;
