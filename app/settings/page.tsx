export default function SettingsPage() {
  return (
    <div>
      <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
        Settings
      </h1>
      <p className="mt-1 text-sm text-foreground/70">
        Preferences (e.g. default check weights) will live here. (Optional feature.)
      </p>

      <div className="mt-6 rounded-lg border border-dashed border-surface-border p-8 text-center text-sm text-foreground/50">
        Nothing to configure yet
      </div>
    </div>
  );
}
