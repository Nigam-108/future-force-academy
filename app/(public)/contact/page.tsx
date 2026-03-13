import { ContactForm } from "@/components/forms/contact-form";
import { PageShell } from "@/components/shared/page-shell";

export default function ContactPage() {
  return (
    <PageShell title="Contact & Support" description="Reach out for enquiry, issue reporting, or general support.">
      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-3xl border bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-semibold text-slate-900">Support Information</h2>
          <div className="mt-6 space-y-4 text-sm text-slate-600">
            <p><span className="font-semibold text-slate-900">Email:</span> support@example.com</p>
            <p><span className="font-semibold text-slate-900">Mobile:</span> +91 99999 99999</p>
            <p><span className="font-semibold text-slate-900">Brand:</span> Future Force Academy</p>
          </div>
          <div className="mt-8 rounded-2xl border p-5">
            <h3 className="font-semibold text-slate-900">Need help?</h3>
            <p className="mt-2 text-sm text-slate-600">
              Use the form to submit any support request, exam-related enquiry, or issue regarding access and tests.
            </p>
          </div>
        </div>
        <ContactForm />
      </div>
    </PageShell>
  );
}