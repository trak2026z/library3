import { HealthCheck } from "@/components/HealthCheck";

export default function HomePage() {
  return (
    <>
      <h1>Library</h1>
      <p>Frontend skeleton (Next.js + TS). Następny krok: Docker Compose.</p>
      <HealthCheck />
    </>
  );
}