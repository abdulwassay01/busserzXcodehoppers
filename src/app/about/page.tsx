export default function AboutPage() {
  return (
    <div className="page-shell">
      <div className="container-wide anim-rise">
        <h1 className="page-title">About busserzXcodehoppers</h1>
        <p className="page-subtitle">
          We started as a tiny chef-and-coder collaboration: one side obsessed
          with flavor, the other with systems. Today we serve food designed for
          community tables, quick lunches, and memorable evenings.
        </p>
      </div>

      <div className="container-wide two-col-grid anim-rise-delay">
        <section className="panel">
          <h2>What We Believe</h2>
          <p className="muted">
            Hospitality should feel warm, transparent, and generous. We cook
            with real ingredients, source carefully, and keep service human.
          </p>
        </section>
        <section className="panel">
          <h2>How We Work</h2>
          <p className="muted">
            Small-batch prep, daily tastings, and iterative menu updates let us
            keep quality consistent while still surprising returning guests.
          </p>
        </section>
      </div>
    </div>
  );
}