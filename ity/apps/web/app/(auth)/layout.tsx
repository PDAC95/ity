import Link from 'next/link';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-zinc-900">
      {/* Left panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 lg:flex-col lg:justify-between bg-zinc-950 border-r border-zinc-800 p-12">
        <div>
          <Link href="/" className="text-2xl font-bold tracking-tight text-[#bfdbfe]">
            ITY
          </Link>
          <p className="mt-1 text-sm text-zinc-400">I Teach You</p>
        </div>

        <div className="space-y-6">
          <h2 className="text-4xl font-bold leading-tight text-zinc-100">
            Build your online school
            <br />
            <span className="text-[#bfdbfe]">in minutes, not months.</span>
          </h2>
          <p className="max-w-md text-lg text-zinc-400">
            Join thousands of creators who use ITY to build, launch and grow
            their online education business.
          </p>

          <div className="flex items-center gap-8 pt-4">
            <div>
              <p className="text-3xl font-bold text-zinc-100">10K+</p>
              <p className="text-sm text-zinc-400">Creators</p>
            </div>
            <div className="h-10 w-px bg-zinc-700" />
            <div>
              <p className="text-3xl font-bold text-zinc-100">500K+</p>
              <p className="text-sm text-zinc-400">Students</p>
            </div>
            <div className="h-10 w-px bg-zinc-700" />
            <div>
              <p className="text-3xl font-bold text-zinc-100">50+</p>
              <p className="text-sm text-zinc-400">Countries</p>
            </div>
          </div>
        </div>

        <p className="text-sm text-zinc-500">
          &copy; {new Date().getFullYear()} ITY. All rights reserved.
        </p>
      </div>

      {/* Right panel - Auth form */}
      <div className="flex w-full flex-col justify-center px-6 py-12 lg:w-1/2 lg:px-16">
        <div className="mx-auto w-full max-w-[420px]">
          {/* Mobile logo */}
          <div className="mb-8 text-center lg:hidden">
            <Link href="/" className="text-3xl font-bold tracking-tight text-[#bfdbfe]">
              ITY
            </Link>
            <p className="mt-1 text-sm text-zinc-400">I Teach You</p>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
