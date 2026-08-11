import { MongoClient, ObjectId } from "mongodb";

export async function onRequest(context) {
  const { env, params } = context;

  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json",
  };

  try {
    const id = params.id;

    const client = new MongoClient(env.MONGODB_URI);
    await client.connect();

    const db = client.db("asianflix");
    const dramas = db.collection("dramas");

    const drama = await dramas.findOne({ _id: new ObjectId(id) });

    if (!drama) {
      return new Response(
        JSON.stringify({ error: "Drama not found" }),
        { status: 404, headers }
      );
    }

    return new Response(JSON.stringify(drama), { headers });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers }
    );
  }
} 
