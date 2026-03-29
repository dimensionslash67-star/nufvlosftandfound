const steps = [
  {
    title: 'Step 1: Find Your Item',
    description: 'Browse the available item list and look for a close match using the item description, category, and location.',
  },
  {
    title: 'Step 2: Note the Details',
    description: 'Write down the item ID and key identifying details so the office can verify the correct record quickly.',
  },
  {
    title: 'Step 3: Visit Our Office',
    description: 'Go to the Student Discipline Office during office hours and tell the staff which item you are claiming.',
  },
  {
    title: 'Step 4: Verify & Claim',
    description: 'Present proof of ownership, answer the verification questions, and complete the release process.',
  },
];

export function HowToClaim() {
  return (
    <section className="space-y-6" id="how-to-claim">
      <div className="text-center">
        <h2 className="text-3xl font-semibold text-slate-900">How to Claim an Item</h2>
        <p className="mt-2 text-sm text-slate-500">
          Follow the steps below before visiting the office to keep the verification process smooth.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {steps.map((step) => (
          <article key={step.title} className="rounded-2xl bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
            <h3 className="text-lg font-semibold text-[#1e3a8a]">{step.title}</h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">{step.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
