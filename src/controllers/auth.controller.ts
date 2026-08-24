import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User";
import { RegisterInput, LoginInput } from "../schemas/auth.schema";
import { UserRole } from "../types/auth.types";
import { ConflictError, UnauthorizedError } from "../core/errors";
import { sendError } from "../core/http-error";

const ACCESS_TOKEN_MAX_AGE_MS = 15 * 60 * 1000; // 15 minutes
const REFRESH_TOKEN_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function getAccessSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("Missing JWT_SECRET environment variable");
  return secret;
}

function getRefreshSecret(): string {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) throw new Error("Missing JWT_REFRESH_SECRET environment variable");
  return secret;
}

function setSessionCookies(res: Response, userId: string, role: UserRole): void {
  const accessToken = jwt.sign({ userId, role }, getAccessSecret(), {
    expiresIn: process.env.JWT_EXPIRES_IN ?? "15m",
  } as jwt.SignOptions);

  const refreshToken = jwt.sign({ userId, role }, getRefreshSecret(), {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? "7d",
  } as jwt.SignOptions);

  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: ACCESS_TOKEN_MAX_AGE_MS,
  });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: REFRESH_TOKEN_MAX_AGE_MS,
  });
}

export async function registerUser(req: Request<{}, {}, RegisterInput>, res: Response): Promise<void> {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new ConflictError("El email ya esta en uso");
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({ name, email, password: hashedPassword });

    res.status(201).json({
      success: true,
      data: { id: newUser._id, name: newUser.name, email: newUser.email, role: newUser.role },
    });
  } catch (error) {
    sendError(res, error);
  }
}

export async function login(req: Request<{}, {}, LoginInput>, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      throw new UnauthorizedError("Credenciales invalidas");
    }

    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) {
      throw new UnauthorizedError("Credenciales invalidas");
    }

    setSessionCookies(res, user._id.toString(), user.role);

    res.status(200).json({
      success: true,
      data: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    sendError(res, error);
  }
}

export async function logout(_req: Request, res: Response): Promise<void> {
  try {
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    res.status(200).json({ success: true, data: { message: "Sesion cerrada" } });
  } catch (error) {
    sendError(res, error);
  }
}
