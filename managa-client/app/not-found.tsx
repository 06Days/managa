import Link from "next/link";
import { Icon } from "@/components/Icons";

export default function NotFound() {
  return (
    <div className="card empty-card">
      <div className="card-body text-center py-5 d-flex flex-column align-items-center gap-3">
        <div className="app-icon" aria-hidden="true">
          <Icon name="alert" size={26} />
        </div>
        <div>
          <h2 className="h4">Page not found</h2>
          <p className="text-secondary mb-0">
            The page you are looking for does not exist in the managa panel.
          </p>
        </div>
        <Link
          className="btn btn-primary d-inline-flex align-items-center gap-2"
          href="/"
        >
          <Icon name="arrow-left" size={16} />
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
