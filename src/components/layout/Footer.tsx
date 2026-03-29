import Link from 'next/link';

export function Footer() {
  return (
    <footer className="bg-[#0f172a] text-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 md:grid-cols-3 md:px-8">
        <section>
          <h3 className="text-lg font-semibold">About</h3>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            The NU Fairview Lost &amp; Found portal helps students quickly identify reported items and understand the claim process before visiting the Student Discipline Office.
          </p>
        </section>

        <section>
          <h3 className="text-lg font-semibold">Quick Links</h3>
          <div className="mt-3 flex flex-col gap-2 text-sm text-slate-300">
            <Link className="hover:text-white" href="#browse-items">Browse Items</Link>
            <Link className="hover:text-white" href="#how-to-claim">How to Claim</Link>
            <Link className="hover:text-white" href="/login">Staff Login</Link>
          </div>
        </section>

        <section>
          <h3 className="text-lg font-semibold">Contact Info</h3>
          <div className="mt-3 space-y-2 text-sm text-slate-300">
            <p>Email: sdo@nu-fairview.edu.ph</p>
            <p>Bug Reports: aureocv@students.nu-fairview.edu.ph</p>
            <p>Location: Student Discipline Office, 2nd Floor</p>
            <p>Hours: M-F 8:00 AM - 5:00 PM</p>
            <p>Saturday: 8:00 AM - 12:00 PM</p>
          </div>
        </section>
      </div>

      <div className="border-t border-white/10 px-4 py-4 text-center text-sm text-slate-400">
        Crafted for NU Fairview Lost &amp; Found by Aureo CV.
      </div>
    </footer>
  );
}
