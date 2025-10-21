import "dotenv/config";

interface constantsTypes {
  dbURL: string;
  refresh_Token_Key: string;
  access_Token_Key: string;
}
export const constants: constantsTypes = {
  dbURL: process.env.DB_URL!,
  refresh_Token_Key: process.env.REFRESH_TOKEN_SECRETKEY!,
  access_Token_Key: process.env.ACCESS_TOKEN_SECRETKEY!,
};
