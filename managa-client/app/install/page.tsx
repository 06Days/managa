import { Icon } from "@/components/Icons";
import { InstallForm } from "@/components/InstallForm";

export default function InstallPage() {
  return (
    <>
      <section className="d-flex flex-wrap justify-content-between align-items-end gap-3 mb-4">
        <div>
          <div className="text-uppercase small fw-semibold text-info mb-2 d-inline-flex align-items-center gap-1">
            <Icon name="github" size={14} />
            Install
          </div>
          <h1 className="h2 mb-1">Pull an app from GitHub</h1>
          <p className="text-secondary mb-0">
            managa clones the repository, validates the app manifest, installs
            dependencies, builds the client and server, then registers the app
            in your dashboard. The repository README documents the manifest
            format and requirements.
          </p>
        </div>
      </section>

      <div className="row">
        <div className="col-lg-9 col-xl-8">
          <article className="card shadow-sm">
            <div className="card-body p-4">
              <h2 className="h5 mb-3">Repository</h2>
              <InstallForm />
            </div>
          </article>
        </div>
      </div>
    </>
  );
}
