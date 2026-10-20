import { Icon } from "@/components/Icons";
import { InstallForm } from "@/components/InstallForm";

export default function InstallPage() {
  return (
    <>
      <section className="section-head page-head">
        <div>
          <span className="eyebrow">
            <Icon name="github" size={14} />
            Install
          </span>
          <h1>Pull an app from GitHub</h1>
          <p className="muted">
            managa clones the repository, validates the app manifest, installs
            dependencies, builds the client and server, then registers the app
            in your dashboard. The repository README documents the manifest
            format and requirements.
          </p>
        </div>
      </section>

      <article className="panel install-panel">
        <h2>Repository</h2>
        <InstallForm />
      </article>
    </>
  );
}
