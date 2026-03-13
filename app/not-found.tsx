import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-warm-100">
          <span className="text-3xl font-bold text-warm-400">?</span>
        </div>
        <h1 className="text-4xl font-bold text-warm-800">404</h1>
        <p className="mt-2 text-lg text-warm-500">找不到此頁面</p>
        <Link
          href="/"
          className="mt-4 inline-block rounded-xl bg-primary-500 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-600"
        >
          回到首頁
        </Link>
      </div>
    </div>
  );
}
