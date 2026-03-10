import Database from "better-sqlite3";
import { getMarketPrice } from "../services/marketData.js";
import type { Position } from "./types.js";

const db = new Database("portfolio.db");

export function dbInit() {
	try {
		//const schemaPath = path.join(process.cwd(), "src/portfolio/schema.sql");
		//const schema = fs.readFileSync(schemaPath, "utf8");
		db.exec(`
            CREATE TABLE IF NOT EXISTS portfolio (
                symbol TEXT PRIMARY KEY,
                qty INTEGER NOT NULL,
                avg_price REAL NOT NULL
            );
            
            CREATE TABLE IF NOT EXISTS trades (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                symbol TEXT NOT NULL,
                qty INTEGER NOT NULL,
                side TEXT NOT NULL,
                price REAL NOT NULL,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
            );
            
            CREATE TABLE IF NOT EXISTS account (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                cash REAL NOT NULL
            );
            
            INSERT OR IGNORE INTO account(id, cash) VALUES(1, 100000.0);
				`);
		console.error("[Database] Schema initialized successfully.");
	} catch (error) {
		console.error("[Database] Initialization failed:", error);
		process.exit(1);
	}
}

export function getPositions(): Position[] {
	return db.prepare("SELECT symbol, qty, avg_price AS avgPrice FROM portfolio").all() as Position[];
}

export function getCash(): number {
	const row = db.prepare("SELECT cash FROM account WHERE id=1").get() as { cash: number };
	return row.cash;
}

export async function executeVirtualTrade(symbol: string, qty: number, side: "BUY" | "SELL") {
	const marketData = await getMarketPrice(symbol, true);
	const price = marketData.price;
	const totalValue = qty * price;
	const currentCash = getCash();

	if (side === "BUY" && currentCash < totalValue) {
		throw new Error(`Insufficient funds. Need ₹${totalValue.toFixed(2)}, have ₹${currentCash.toFixed(2)}`);
	}

	const transaction = db.transaction(() => {
		const newCash = side === "BUY" ? currentCash - totalValue : currentCash + totalValue;

		db.prepare("UPDATE account SET cash = ? WHERE id = 1").run(newCash);
		db.prepare("INSERT INTO trades (symbol, qty, side, price) VALUES (?, ?, ?, ?)")
			.run(symbol, qty, side, price);

		const existing = db.prepare("SELECT * FROM portfolio WHERE symbol = ?").get(symbol) as { qty: number, avg_price: number } | undefined;

		if (side === "BUY") {
			if (existing) {
				const newQty = existing.qty + qty;
				const newAvg = ((existing.avg_price * existing.qty) + totalValue) / newQty;
				db.prepare("UPDATE portfolio SET qty = ?, avg_price = ? WHERE symbol = ?")
					.run(newQty, newAvg, symbol);
			} else {
				db.prepare("INSERT INTO portfolio (symbol, qty, avg_price) VALUES (?, ?, ?)")
					.run(symbol, qty, price);
			}
		} else {
			if (!existing || existing.qty < qty) {
				throw new Error(`Not enough ${symbol} to sell. Owned: ${existing?.qty || 0}`);
			}
			const newQty = existing.qty - qty;
			if (newQty === 0) {
				db.prepare("DELETE FROM portfolio WHERE symbol = ?").run(symbol);
			} else {
				db.prepare("UPDATE portfolio SET qty = ? WHERE symbol = ?").run(newQty, symbol);
			}
		}

		return { newCash, price };
	});

	const result = transaction();

	return {
		...result,
		symbol,
		qty,
		side,
		totalValue
	};
}
