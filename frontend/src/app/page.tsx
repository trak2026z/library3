import { BooksList } from "@/components/BooksList";
import { HealthCheck } from "@/components/HealthCheck";

export default function HomePage() {
  return (
    <>
      <h1>Library</h1>
      <p>Frontend skeleton (Next.js + TS). Docker Compose proxy: /api → backend.</p>

      <HealthCheck />
      <hr />
      <BooksList />
    </>
  );
}