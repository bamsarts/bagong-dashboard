import { pool } from "../../config/database";
import { NextResponse } from "next/server";

export default async function handler(req, res){
  try {
      console.log(req.query)

      let results

      if(req.query?.id){
         results = await pool.query(`SELECT * FROM news WHERE id = ${req.query.id}`);
      }else{
         results = await pool.query("SELECT * FROM news");
      }

      res.status(200).json({ data: results })

  } catch (e) {

      res.status(400).json({ message: e.message})
  }
}

// export async function GET() {
//   try {
//     const results = await pool.query("SELECT * FROM product");
//     return NextResponse.json(results);
//   } catch (error) {
//     return NextResponse.json(
//       { message: error.message },
//       {
//         status: 500,
//       }
//     );
//   }
// }

// export async function POST(request) {
//   try {
//     const { name, description, price } = await request.json();
//     console.log(name, description, price);

//     const result = await pool.query("INSERT INTO product SET ?", {
//       name,
//       description,
//       price,
//     });

//     return NextResponse.json({ name, description, price, id: result.insertId });
//   } catch (error) {
//     return NextResponse.json(
//       { message: error.message },
//       {
//         status: 500,
//       }
//     );
//   }
// }
