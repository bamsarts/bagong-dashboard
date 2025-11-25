import mysql from "serverless-mysql";

export const pool = mysql({
  config: {
    host: "indo-data.id",
    user: "damriproductionaccrw1",
    password: "!@#Damripcw1@bisku_id",
    port: 3352,
    database: "cms_damri",
  },
});