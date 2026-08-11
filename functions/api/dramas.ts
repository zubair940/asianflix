 import { MongoClient } from "mongodb";

export async function onRequest(context) {
  const { env } = context;

  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json",
  };

  try {
    const client = new MongoClient(env.MONGODB_URI);
    await client.connect();

    const db = client.db("asianflix");
    const dramas = db.collection("dramas");

    const allDramas = await dramas.find({}).toArray();

    return new Response(JSON.stringify(allDramas), { headers });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers }
    );
  }
}
