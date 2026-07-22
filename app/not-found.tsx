import Link from "next/link";

export default function NotFound() {
  return (
    <main className="not-found">
      <span className="section-kicker">Trail not found</span>
      <h1>This path ends here.</h1>
      <p>The mountain you requested is not in the current catalog.</p>
      <Link className="primary-button" href="/">
        Return to basecamp
      </Link>
    </main>
  );
}
