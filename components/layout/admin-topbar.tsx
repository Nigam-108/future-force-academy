type Props = {
  isOpen: boolean;
  onToggle: () => void;
};

function HamburgerToggle({ isOpen, onToggle }: { isOpen: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className="group relative flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 active:scale-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      style={{ transition: "transform 0.12s ease, background-color 0.2s ease, color 0.2s ease" }}
      aria-label={isOpen ? "Close sidebar" : "Open sidebar"}
    >
      <span className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 ring-1 ring-slate-200" />

      <span className="relative flex flex-col items-center justify-center w-[18px] h-[14px]">
        {/* Top line */}
        <span
          className="absolute block h-[2px] rounded-full bg-current"
          style={{
            width: "18px",
            transformOrigin: "center",
            transform: isOpen ? "rotate(45deg) translateY(0px)" : "rotate(0deg) translateY(-6px)",
            transition: isOpen
              ? "transform 340ms cubic-bezier(0.68,-0.6,0.32,1.6)"
              : "transform 340ms cubic-bezier(0.68,-0.6,0.32,1.6) 40ms",
          }}
        />
        {/* Middle line */}
        <span
          className="absolute block h-[2px] rounded-full bg-current"
          style={{
            transformOrigin: "center",
            width: isOpen ? "0px" : "13px",
            opacity: isOpen ? 0 : 1,
            transition: isOpen
              ? "width 220ms ease 0ms, opacity 180ms ease 0ms"
              : "width 220ms ease 80ms, opacity 180ms ease 80ms",
          }}
        />
        {/* Bottom line */}
        <span
          className="absolute block h-[2px] rounded-full bg-current"
          style={{
            width: "18px",
            transformOrigin: "center",
            transform: isOpen ? "rotate(-45deg) translateY(0px)" : "rotate(0deg) translateY(6px)",
            transition: isOpen
              ? "transform 340ms cubic-bezier(0.68,-0.6,0.32,1.6)"
              : "transform 340ms cubic-bezier(0.68,-0.6,0.32,1.6) 40ms",
          }}
        />
      </span>
    </button>
  );
}

export function AdminTopbar({ isOpen, onToggle }: Props) {
  return (
    <div className="sticky top-0 z-10 border-b bg-white px-4 py-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <HamburgerToggle isOpen={isOpen} onToggle={onToggle} />
          <div>
            <h1 className="text-lg font-semibold text-slate-900">Admin Dashboard</h1>
            <p className="hidden sm:block text-sm text-slate-500">
              Manage tests, question bank, students, payments, and reports.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700">
            Main Admin
          </span>
        </div>
      </div>
    </div>
  );
}