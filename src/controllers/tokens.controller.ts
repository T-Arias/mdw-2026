import { Request, Response } from "express";
import { issueToken, listTokens, revokeToken } from "../auth/token.service";
import { IssueTokenInput } from "../schemas/token.schema";
import { sendError } from "../core/http-error";

export async function createToken(
  req: Request<{}, {}, IssueTokenInput>,
  res: Response
): Promise<void> {
  try {
    const issued = await issueToken(req.body);
    res.status(201).json({ success: true, data: issued });
  } catch (error) {
    sendError(res, error);
  }
}

export async function getTokens(_req: Request, res: Response): Promise<void> {
  try {
    const tokens = await listTokens();
    res.status(200).json({ success: true, data: tokens });
  } catch (error) {
    sendError(res, error);
  }
}

export async function deleteToken(req: Request<{ id: string }>, res: Response): Promise<void> {
  try {
    await revokeToken(req.params.id);
    res.status(204).send();
  } catch (error) {
    sendError(res, error);
  }
}
