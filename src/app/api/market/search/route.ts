import { NextRequest, NextResponse } from "next/server";

type Instrument = {
  symbol: string;
  instrument_name: string;
  exchange?: string;
  mic_code?: string;
  exchange_timezone?: string;
  instrument_type?: string;
  country?: string;
  currency?: string;
  figi?: string;
  wkn?: string;
};

const popularSuggestions: Instrument[] = [
  {
    symbol: "AAPL",
    instrument_name: "Apple Inc",
    exchange: "NASDAQ",
    mic_code: "XNAS",
    instrument_type: "Common Stock",
    country: "United States",
    currency: "USD",
  },
  {
    symbol: "MSFT",
    instrument_name: "Microsoft Corp",
    exchange: "NASDAQ",
    mic_code: "XNAS",
    instrument_type: "Common Stock",
    country: "United States",
    currency: "USD",
  },
  {
    symbol: "NVDA",
    instrument_name: "NVIDIA Corp",
    exchange: "NASDAQ",
    mic_code: "XNAS",
    instrument_type: "Common Stock",
    country: "United States",
    currency: "USD",
  },
  {
    symbol: "AMZN",
    instrument_name: "Amazon.com Inc",
    exchange: "NASDAQ",
    mic_code: "XNAS",
    instrument_type: "Common Stock",
    country: "United States",
    currency: "USD",
  },
  {
    symbol: "TSLA",
    instrument_name: "Tesla Inc",
    exchange: "NASDAQ",
    mic_code: "XNAS",
    instrument_type: "Common Stock",
    country: "United States",
    currency: "USD",
  },
  {
    symbol: "SAP",
    instrument_name: "SAP SE",
    exchange: "XETRA",
    instrument_type: "Common Stock",
    country: "Germany",
    currency: "EUR",
  },
  {
    symbol: "SIE",
    instrument_name: "Siemens AG",
    exchange: "XETRA",
    instrument_type: "Common Stock",
    country: "Germany",
    currency: "EUR",
  },
  {
    symbol: "ALV",
    instrument_name: "Allianz SE",
    exchange: "XETRA",
    instrument_type: "Common Stock",
    country: "Germany",
    currency: "EUR",
  },
];

async function searchTwelveData(
  query: string,
  apiKey: string
): Promise<Instrument[]> {
  const params = new URLSearchParams({
    symbol: query,
    outputsize: "20",
    apikey: apiKey,
  });

  const response = await fetch(
    `https://api.twelvedata.com/symbol_search?${params.toString()}`,
    {
      next: {
        revalidate: 60,
      },
    }
  );

  if (!response.ok) {
    return [];
  }

  const result = await response.json();

  if (result.status === "error") {
    return [];
  }

  return result.data ?? [];
}

async function searchWkn(
  wkn: string,
  twelveDataApiKey: string
): Promise<Instrument[]> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  // Optional:
  // Falls wir später einen OpenFIGI-Key eintragen,
  // wird er automatisch benutzt.
  if (process.env.OPENFIGI_API_KEY) {
    headers["X-OPENFIGI-APIKEY"] =
      process.env.OPENFIGI_API_KEY;
  }

  const response = await fetch(
    "https://api.openfigi.com/v3/mapping",
    {
      method: "POST",
      headers,
      body: JSON.stringify([
        {
          idType: "ID_WERTPAPIER",
          idValue: wkn.toUpperCase(),
        },
      ]),
      cache: "no-store",
    }
  );

  if (!response.ok) {
    return [];
  }

  const result = await response.json();

  const mappings = result?.[0]?.data;

  if (!Array.isArray(mappings) || mappings.length === 0) {
    return [];
  }

  const mapping =
    mappings.find(
      (item: { ticker?: string; marketSector?: string }) =>
        item.ticker && item.marketSector === "Equity"
    ) ??
    mappings.find(
      (item: { ticker?: string }) => item.ticker
    );

  if (!mapping?.ticker) {
    return [];
  }

  // OpenFIGI löst die WKN auf.
  // Mit dem gefundenen Ticker suchen wir anschließend
  // das handelbare Instrument bei Twelve Data.
  const twelveResults = await searchTwelveData(
    mapping.ticker,
    twelveDataApiKey
  );

  if (twelveResults.length > 0) {
    return twelveResults.map((instrument) => ({
      ...instrument,
      wkn: wkn.toUpperCase(),
      figi: mapping.figi ?? undefined,
    }));
  }

  // Fallback, falls Twelve Data keinen Suchtreffer liefert.
  return [
    {
      symbol: mapping.ticker,
      instrument_name:
        mapping.name ??
        mapping.securityDescription ??
        mapping.ticker,
      instrument_type:
        mapping.securityType2 ??
        mapping.securityType,
      figi: mapping.figi ?? undefined,
      wkn: wkn.toUpperCase(),
    },
  ];
}

export async function GET(request: NextRequest) {
  const query =
    request.nextUrl.searchParams.get("q")?.trim() ?? "";

  if (!query) {
    return NextResponse.json({
      data: popularSuggestions,
      source: "popular",
    });
  }

  const apiKey = process.env.TWELVE_DATA_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      {
        error: "TWELVE_DATA_API_KEY fehlt.",
      },
      {
        status: 500,
      }
    );
  }

  try {
    /*
     * WKN besteht aus 6 Zeichen.
     * Wir versuchen bei passenden Eingaben zuerst OpenFIGI.
     *
     * Falls es doch ein 6-stelliger Ticker/Begriff ist
     * und keine WKN gefunden wird, fällt die Suche
     * automatisch auf Twelve Data zurück.
     */
    const looksLikeWkn = /^[A-Za-z0-9]{6}$/.test(query);

    if (looksLikeWkn) {
      const wknResults = await searchWkn(query, apiKey);

      if (wknResults.length > 0) {
        return NextResponse.json({
          data: wknResults,
          source: "wkn",
        });
      }
    }

    const data = await searchTwelveData(query, apiKey);

    return NextResponse.json({
      data,
      source: "twelve-data",
    });
  } catch {
    return NextResponse.json(
      {
        error: "Fehler beim Laden der Wertpapiersuche.",
      },
      {
        status: 500,
      }
    );
  }
}