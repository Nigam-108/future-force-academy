import Link from "next/link";

export function PublicFooter() {
  return (
    <footer className="border-t bg-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-3 lg:px-8">
        <div>
          <h3 className="text-lg font-semibold">Future Force Academy</h3>
          <p className="mt-2 text-sm text-slate-600">
            Smart mock tests, real exam practice, better results.
          </p>
        </div>

        <div>
          <h4 className="text-sm font-semibold">Quick Links</h4>
          <div className="mt-3 flex flex-col gap-2 text-sm text-slate-600">
            <Link href="/privacy-policy">Privacy Policy</Link>
            <Link href="/terms">Terms & Conditions</Link>
            <Link href="/contact">Contact</Link>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold">Contact</h4>
          <div className="mt-3 flex flex-col gap-2 text-sm text-slate-600">
            <span>Email: support@example.com</span>
            <span>Mobile: +91 99999 99999</span>
            <span>© Future Force Academy</span>
          </div>
        </div>
      </div>
    </footer>
  );
}