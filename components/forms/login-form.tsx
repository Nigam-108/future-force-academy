export function LoginForm() {
  return (
    <form className="space-y-4 rounded-3xl border bg-white p-8 shadow-sm">
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">Email</label>
        <input
          type="email"
          className="w-full rounded-xl border px-4 py-3 outline-none"
          placeholder="Enter your email"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">Password</label>
        <input
          type="password"
          className="w-full rounded-xl border px-4 py-3 outline-none"
          placeholder="Enter your password"
        />
      </div>

      <button className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700">
        Login
      </button>
    </form>
  );
}