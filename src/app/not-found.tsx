import Link from 'next/link';

export default function NotFound() {
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
            404
          </h1>
          <div className="inline">
            <p
              className="inline-block h2 text-sm font-sans"
              style={{ lineHeight: '49px', verticalAlign: 'bottom' }}
            >
              Not Found. Please check if your url is correct.
            </p>
          </div>
        </div>
      </div>

      <Link href="/">
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
