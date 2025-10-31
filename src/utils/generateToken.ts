import jwt from "jsonwebtoken";
import ms from "ms";
interface payloadType {
  email: string;
  id?: string;
}

export function generateToken(
  payload: payloadType,
  key: string,
  expiresIn?: number|ms.StringValue
) {
  const token = jwt.sign(payload, key, { expiresIn });
  return token;
}
