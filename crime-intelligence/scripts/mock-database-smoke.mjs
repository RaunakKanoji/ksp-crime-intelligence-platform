const baseUrl = process.env.MOCK_DATABASE_BASE_URL || "http://127.0.0.1:3000";

async function request(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, options);
  const payload = await response.json();
  if (!response.ok || payload?.success === false) {
    throw new Error(`${options.method || "GET"} ${path} failed: ${JSON.stringify(payload)}`);
  }
  return payload;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

try {
  const status = await request("/api/mock/status");
  assert(status.data.provider === "mock", "The active provider is not mock.");
  assert(status.data.counts.incidents >= 300, "The seeded incident count is below the contract minimum.");
  assert(status.data.counts.cases >= 200, "The seeded case count is below the contract minimum.");

  const validation = await request("/api/mock/validate");
  assert(validation.data.valid === true, "Mock database validation reported invalid relationships.");

  const cases = await request("/api/cases?page=1&pageSize=3");
  assert(Array.isArray(cases.data.data) && cases.data.data.length === 3, "Case pagination did not return three rows.");
  const firstCase = cases.data.data[0];

  const timeline = await request(`/api/cases/${encodeURIComponent(firstCase.id)}/timeline`);
  assert(Array.isArray(timeline.data), "Case timeline endpoint did not return an array.");

  const map = await request("/api/map/incidents?role=Analyst");
  assert(map.data?.type === "FeatureCollection", "Map incident endpoint did not return GeoJSON.");

  const search = await request("/api/search?q=MOCK&limit=3");
  assert(search.data && Array.isArray(search.data.cases), "Global search did not return typed result groups.");

  const conversation = await request("/api/conversations", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ userId: "USR-MOCK-0001", query: "Show high priority cases" }),
  });
  assert(conversation.data?.answer?.isSyntheticData === true, "Conversation response was not marked synthetic.");

  const reset = await request("/api/mock/reset", { method: "POST" });
  assert(reset.data?.counts?.incidents === status.data.counts.incidents, "Mock reset changed the deterministic incident count.");
  const afterReset = await request("/api/mock/validate");
  assert(afterReset.data.valid === true, "Mock validation failed after reset.");

  console.log(JSON.stringify({ ok: true, provider: status.data.provider, counts: status.data.counts }, null, 2));
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
