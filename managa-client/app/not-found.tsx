import Link from "next/link";
import { Icon } from "@/components/Icons";

export default function NotFound() {
  return (
    <div className="empty-state">
      <div className="empty-icon">
        <Icon name="alert" size={26} />
      </div>
      <h2>Page not found</h2>
      <p>The page you are looking for does not exist in the managa panel.</p>
      <Link className="btn btn-primary" href="/">
        <Icon name="arrow-left" size={16} />
        Back to dashboard
      </Link>
    </div>
  );
}
