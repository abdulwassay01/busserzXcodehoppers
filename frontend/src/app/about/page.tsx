export default function AboutPage() {
  return (
    <div className="page-shell">
      <div className="container-wide anim-rise">
        <h1 className="page-title">About busserzXcodehoppers</h1>
        <p className="page-subtitle">
          We started as a chef-and-coder collaboration: one side obsessed with wood-fired flavor, the other with clean real-time systems. Today we serve food designed for community tables and memorable evenings.
        </p>
      </div>

      <div className="container-wide two-col-grid anim-rise-delay">
        <section className="panel">
          <div className="feature-icon">✨</div>
          <h2>What We Believe</h2>
          <p className="muted">
            Hospitality should feel warm, transparent, and generous. We cook with real local ingredients, source carefully, and keep service human and responsive.
          </p>
        </section>
        <section className="panel">
          <div className="feature-icon">🔥</div>
          <h2>How We Work</h2>
          <p className="muted">
            Small-batch prep, daily tastings, and iterative menu updates let us keep quality consistent while surprising returning guests with fresh culinary flights.
          </p>
        </section>
      </div>
    </div>
  );
}