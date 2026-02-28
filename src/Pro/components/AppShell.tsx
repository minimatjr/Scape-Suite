// src/components/AppShell.tsx

          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback>{(email?.[0] ?? "U").toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="hidden sm:block">
              <div className="text-sm font-medium leading-none">{email ?? "User"}</div>
              <div className="text-xs text-muted-foreground">Signed in</div>
            </div>
            <Button variant="outline" size="sm" onClick={signOut}>Sign out</Button>
          </div>
        </header>

        <div className="px-6">
          <Separator />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6 px-6 py-6">
          <aside className="rounded-2xl border bg-card p-3 h-fit sticky top-6">
            <nav className="space-y-1">
              <NavLink
                to="/contacts"
                className={({ isActive }) =>
                  cx(
                    "block rounded-xl px-3 py-2 text-sm transition",
                    isActive ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                  )
                }
              >
                Contacts
              </NavLink>
              <NavLink
                to="/projects"
                className={({ isActive }) =>
                  cx(
                    "block rounded-xl px-3 py-2 text-sm transition",
                    isActive ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                  )
                }
              >
                Projects
              </NavLink>
            </nav>

            <div className="mt-4 rounded-xl bg-muted p-3">
              <div className="text-xs font-medium">Next steps</div>
              <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                <li>• Add PDF generation (Quote/Invoice)</li>
                <li>• Attach photos & measurements</li>
                <li>• Email sending + payment status</li>
              </ul>
            </div>
          </aside>

          <main className="min-w-0">{children}</main>
        </div>
      </div>
    </div>
  );
}