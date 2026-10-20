import Link from "next/link";

export function Navbar() {
  return (
    <nav className="navbar navbar-expand bg-white border-bottom sticky-top quita-navbar">
      <div className="container">
        <Link
          className="navbar-brand d-flex align-items-center gap-2 fw-bold"
          href="/"
        >
          <span className="brand-mark" aria-hidden="true">
            <i className="bi bi-buildings" />
          </span>
          <span>quita</span>
        </Link>

        <div className="d-flex align-items-center gap-2">
          <span className="badge rounded-pill text-bg-light border d-none d-sm-inline-flex align-items-center gap-1">
            <i className="bi bi-stars text-warning" />
            One clean day at a time
          </span>
          <Link className="btn btn-sm btn-outline-secondary" href="/">
            <i className="bi bi-grid me-1" />
            Dashboard
          </Link>
        </div>
      </div>
    </nav>
  );
}
