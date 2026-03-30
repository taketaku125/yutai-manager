import { NextResponse } from "next/server";
import { readDb, writeDb } from "@/lib/server-storage";

export async function GET() {
  const db = await readDb();
  return NextResponse.json(db);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const db = await readDb();

    // 更新するデータをマージ
    const newDb = {
      holdings: body.holdings ?? db.holdings,
      customRules: body.customRules ?? db.customRules,
      customStocks: body.customStocks ?? db.customStocks,
    };

    await writeDb(newDb);
    return NextResponse.json({ success: true, db: newDb });
  } catch (error) {
    return NextResponse.json({ error: "保存に失敗しました" }, { status: 500 });
  }
}
