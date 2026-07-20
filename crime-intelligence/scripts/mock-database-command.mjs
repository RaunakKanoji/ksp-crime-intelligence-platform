const command = process.argv[2] || "summary";
const baseUrl = process.env.MOCK_DATABASE_BASE_URL || "http://127.0.0.1:3000";
const endpoint = command === "summary" ? "/api/mock/status" : command === "validate" ? "/api/mock/validate" : command === "seed" ? "/api/mock/seed" : command === "reset" ? "/api/mock/reset" : null;

if (!endpoint) {
  console.error(`Unknown mock database command: ${command}`);
  process.exit(1);
}

try {
  const response = await fetch(`${baseUrl}${endpoint}`, { method: command === "summary" || command === "validate" ? "GET" : "POST" });
  const payload = await response.json();
  console.log(JSON.stringify(payload, null, 2));
  if (!response.ok || payload?.data?.valid === false) process.exit(1);
} catch (error) {
  console.error("Unable to reach the running KSP application. Start it with `npm run dev` first.");
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
