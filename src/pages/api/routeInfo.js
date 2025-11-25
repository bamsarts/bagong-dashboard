import { pool } from "../../config/database";
import { NextResponse } from "next/server";

export default async function handler(req, res){
  try {
      console.log(req.query)

      let results

      if(req.query?.id){
         results = await pool.query(`SELECT * FROM ${req.query?.segment} WHERE id = ${req.query.id}`);
      }else{
         results = await pool.query(`SELECT * FROM ${req.query?.segment}`);
      }

      res.status(200).json({ data: results })

  } catch (e) {

      res.status(400).json({ message: e.message})
  }
}
