export default function LoadingSpinner(): React.ReactElement {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-400 border-t-blue-accent" />
    </div>
  );
}
