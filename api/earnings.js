import {createClient} from "@supabase/supabase-js";

function getSupabase() {
const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

return createClient(url, key, {auth: {persistSession: false}});
}

function sendJson(result, status, object) {
    result.statusCode = status;
    result.setHeader("Content-Type", "application/json; charset=utf-8");
    result.end(JSON.stringify(object));
}

function computeBadge(surprisePercent) {
    if (Math.abs(Number(surprisePercent)) >= 10) {
        return "HIGH";
    } else if (Math.abs(Number(surprisePercent)) >= 5) {
        return "MED";
    } else {
        return "LOW";
    }
}

export default async function handler(request, result) {
    const url = new URL(request.url, "http://placeholder");
    const symbol = (url.searchParams.get("symbol") || "AAPL").trim().toUpperCase();
    const apiKey = process.env.ALPHAVANTAGE_API_KEY;
    const alphaVantageURL = `https://www.alphavantage.co/query?function=EARNINGS&symbol=${encodeURIComponent(symbol)}&apikey=${encodeURIComponent(apiKey)}`;
    const alphaVantageResponse = await fetch(alphaVantageURL);
    const json = await alphaVantageResponse.json();

    const qEarningsArray = json.quarterlyEarnings
    const lastEightQuarters = qEarningsArray.slice(0, 8).map((row) => {
        const surprisePercent = row.surprisePercentage ?? null;
        return {
          symbol,
          reported_date: row.reportedDate || null,
          reported_eps: row.reportedEPS ?? null,
          estimated_eps: row.estimatedEPS ?? null,
          surprise_pct: surprisePercent === null ? null : Number(surprisePercent),
          badge: computeBadge(surprisePercent),
          ingested_at: new Date().toISOString(),
        };
    }).filter((row) => row.reported_date);

    const supabase = getSupabase();
    const upsert = await supabase.from("earnings_history").upsert(lastEightQuarters, {onConflict: "symbol,reported_date"});
    if (upsert.error) {
        return sendJson(result, 500, {error: upsert.error.message});
    }
    return sendJson(result, 200, {symbol, quarters: lastEightQuarters});
}