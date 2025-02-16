import { auth } from '@/auth';
import { Menu } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect('/login');

  if (session.user && session.user.role == 'admin') {
    return (
      <div className="flex min-h-screen w-full flex-col">
        <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
          <nav className="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6 w-full">
            <Link
              href="/home"
              className="flex items-center gap-2 text-lg font-semibold md:text-base"
            >
              <Image
                className="relative dark:drop-shadow-[0_0_0.3rem_#ffffff70]"
                src="/SIT.png"
                alt="Logo"
                width={60}
                height={60}
                priority
              />
            </Link>
            <Link
              href="/admin/dashboard"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              Admin Dashboard
            </Link>
            <Link
              href="/admin/challenges"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              Challenges
            </Link>
            <Link
              href="/admin/users"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              Users
            </Link>
          </nav>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="shrink-0 md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left">
              <nav className="grid gap-6 text-lg font-medium">
                <Link href="/home" className="flex items-center gap-2 text-lg font-semibold">
                  <Image
                    className="relative dark:drop-shadow-[0_0_0.3rem_#ffffff70]"
                    src="/SIT.png"
                    alt="Logo"
                    width={60}
                    height={60}
                    priority
                  />
                </Link>
                <Link
                  href="/admin/dashboard"
                  className="text-muted-foreground hover:text-foreground"
                >
                  Admin Dashboard
                </Link>
              </nav>
            </SheetContent>
          </Sheet>
          <div className="flex w-full items-center justify-end md:ml-auto">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" size="icon" className="rounded-full">
                  <Image
                    src={session.user.image ?? ''}
                    width={100}
                    height={100}
                    className="rounded-full"
                    alt="User Avatar"
                  />
                  <span className="sr-only">Toggle user menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                {/* <DropdownMenuSeparator />
              <DropdownMenuItem>Settings</DropdownMenuItem> */}
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Link href="/logout">Logout</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="min-h-[calc(100vh_-_5rem)]">{children}</main>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col items-center justify-center">
      <div className="flex items-center justify-center">
        <div>
          <h1
            className="inline h1 text-2xl font-sans font-medium pr-5 mr-5"
            style={{
              lineHeight: '49px',
              borderRightWidth: '1px',
              borderRightColor: 'rgba(229,231,235,0.3)',
            }}
          >
            403
          </h1>
          <div className="inline">
            <p
              className="inline-block h2 text-sm font-sans"
              style={{ lineHeight: '49px', verticalAlign: 'bottom' }}
            >
              Forbidden. You do not have permission to access this resource.
            </p>
          </div>
        </div>
      </div>

      <Link href="/home">
        <div className="group rounded-lg border border-transparent mt-10 px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30">
          <h2 className="mb-3 text-2xl font-semibold">
            Return Home{' '}
            <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
              -&gt;
            </span>
          </h2>
        </div>
      </Link>
    </div>
  );
}
