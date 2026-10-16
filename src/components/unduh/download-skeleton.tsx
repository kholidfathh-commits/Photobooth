/** Kerangka halaman unduh selagi data foto dimuat (jaringan event lambat). */
export function DownloadSkeleton() {
  return (
    <main
      className="min-h-dvh bg-neutral-950 px-4 py-8 text-white"
      aria-busy="true"
      aria-label="Memuat foto"
    >
      <div className="mx-auto flex w-full max-w-md animate-pulse flex-col items-center gap-6">
        <div className="size-12 rounded-full bg-white/10" />
        <div className="h-8 w-56 rounded-lg bg-white/10" />
        <div className="aspect-[600/1376] w-full max-w-xs rounded-lg bg-white/10" />
        <div className="h-14 w-full rounded-2xl bg-white/10" />
      </div>
    </main>
  );
}
