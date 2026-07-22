export function LoadingBar() {
  return (
    <div
      className="h-1 w-full overflow-hidden rounded-full bg-black/[.06] dark:bg-white/[.08]"
      role="progressbar"
      aria-label="Cargando"
    >
      <div className="h-full w-1/3 animate-[loading-sweep_1.2s_ease-in-out_infinite] rounded-full bg-foreground" />
    </div>
  );
}
