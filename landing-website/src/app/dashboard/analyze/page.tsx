export default function AnalyzePage() {
  return (
    <div className="container mx-auto py-6">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">ECG Analysis</h1>
          <p className="text-muted-foreground">
            Upload and analyze ECG files using AI-powered analysis.
          </p>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
            <div className="text-2xl font-bold">Coming Soon</div>
            <p className="text-xs text-muted-foreground">
              ECG analysis interface is under development
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}