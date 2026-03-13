export function SignupForm() {
  return (
    <form className="space-y-4 rounded-3xl border bg-white p-8 shadow-sm">
      <input className="w-full rounded-xl border px-4 py-3" placeholder="Full name" />
      <input type="email" className="w-full rounded-xl border px-4 py-3" placeholder="Email" />
      <input className="w-full rounded-xl border px-4 py-3" placeholder="Mobile number" />

      <select className="w-full rounded-xl border px-4 py-3">
        <option>Select exam/course</option>
        <option>Wireless PSI & Technical Operator</option>
        <option>UPSC</option>
        <option>GPSC</option>
        <option>Railway Exams</option>
      </select>

      <input type="password" className="w-full rounded-xl border px-4 py-3" placeholder="Password" />

      <button className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700">
        Create Account
      </button>
    </form>
  );
}