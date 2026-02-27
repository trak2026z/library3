import { createApp } from "./app";

function parsePort(value: string | undefined): number {
  const raw = value ?? "4000";
  const n = Number(raw);
  if (!Number.isInteger(n) || n <= 0 || n > 65535) return 4000;
  return n;
}

const port = parsePort(process.env.PORT);

const app = createApp();

app.listen(port, () => {
  console.log(`backend listening on http://localhost:${port}`);
});