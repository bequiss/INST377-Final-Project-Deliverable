import Papa from "papaparse";
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

function badgeFromEstimate(estimate) {
    if (Number(estimate) >= 2) {
        return "HIGH";
    } else if (Number(estimate) >= 1) {
        return "MED";
    } else {
        return "LOW";
    }
}

export default async function handler(request, result) {
    const url = new URL(request.url, "http://placeholder");
    const refresh = url.searchParams.get("refresh") === "1";
    const supabase = getSupabase();

    if (url.searchParams.get("meta") === "1") {
        const countResponse = await supabase.from("earnings_calendar").select("*", {count: "exact", head: true});

        const lastResponse = await supabase.from("earnings_calendar").select("ingested_at").order("ingested_at", {ascending: false}).limit(1);
        const last = lastResponse.data?.[0]?.ingested_at;
        return sendJson(result, 200, {count: countResponse.count ?? 0, last_ingested: last});
    }

    const existingRows = await supabase.from("earnings_calendar").select("symbol,name,report_date,fiscal_date_ending,estimate,currency,ingested_at").order("report_date", {ascending: true}).limit(200);

    if (refresh || existingRows.data.length === 0) {
        const apiKey = process.env.ALPHAVANTAGE_API_KEY;
        const alphaVantageURL = `https://www.alphavantage.co/query?function=EARNINGS_CALENDAR&horizon=3month&apikey=${encodeURIComponent(apiKey)}`;
        const alphaVantageResponse = await fetch(alphaVantageURL);
        const csvText = await alphaVantageResponse.text();
        const parsed = Papa.parse(csvText, {header: true, skipEmptyLines: true});
        const rows = parsed.data.map((row) => ({
            symbol: (row.symbol || "").trim().toUpperCase(),
            name: row.name || null,
            report_date: row.reportDate || null,
            fiscal_date_ending: row.fiscalDateEnding || null,
            estimate: row.estimate === "" ? null : row.estimate,
            currency: row.currency || null,
            ingested_at: new Date().toISOString(),
            signal_badge: badgeFromEstimate(row.estimate),
        })).filter((row) => row.symbol && row.report_date);

        const upsert = await supabase.from("earnings_calendar").upsert(rows, {onConflict: "symbol,report_date"});
        const reread = await supabase.from("earnings_calendar").select("symbol,name,report_date,fiscal_date_ending,estimate,currency,ingested_at").order("report_date", {ascending: true}).limit(200);
        
        return sendJson(result, 200, {items: reread.data});
    }
    return sendJson(result, 200, {items: existingRows.data});
}