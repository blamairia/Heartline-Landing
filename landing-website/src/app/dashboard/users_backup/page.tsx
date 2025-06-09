export default function UsersBackupPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Users Backup</h1>
          <p className="text-muted-foreground">
            Backup and restore user data and settings.
          </p>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
            <div className="text-2xl font-bold">Coming Soon</div>
            <p className="text-xs text-muted-foreground">
              Users backup interface is under development
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}