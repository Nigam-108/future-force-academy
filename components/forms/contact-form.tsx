export function ContactForm() {
  return (
    <form className="space-y-4 rounded-3xl border bg-white p-8 shadow-sm">
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">Name</label>
        <input className="w-full rounded-xl border px-4 py-3" placeholder="Enter your name" />
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">Email</label>
        <input className="w-full rounded-xl border px-4 py-3" placeholder="Enter your email" />
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">Subject</label>
        <input className="w-full rounded-xl border px-4 py-3" placeholder="Enter subject" />
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">Message</label>
        <textarea className="min-h-32 w-full rounded-xl border px-4 py-3" placeholder="Write your message" />
      </div>
      <button className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700">
        Send Message
      </button>
    </form>
  );
}