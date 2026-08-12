import { createFileRoute, useRouter } from '@tanstack/react-router'
import { createTodo, getTodos } from '#/lib/demo/todos'

import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'

export const Route = createFileRoute('/demo/drizzle')({
  component: DemoDrizzle,
  loader: async () => await getTodos(),
})

function DemoDrizzle() {
  const router = useRouter()
  const todos = Route.useLoaderData()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.target as HTMLFormElement)
    const title = formData.get('title') as string

    if (!title) return

    try {
      await createTodo({ data: { title } })
      await router.invalidate()
      ;(e.target as HTMLFormElement).reset()
    } catch (error) {
      console.error('Failed to create todo:', error)
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col px-4 py-10">
      <section className="w-full rounded-xl border bg-card p-6 text-card-foreground shadow-sm">
        <header className="mb-8 flex items-center gap-4">
          <span className="flex h-14 w-14 items-center justify-center rounded-lg border bg-muted p-3">
            <img src="/drizzle.svg" alt="Drizzle Logo" className="h-8 w-8" />
          </span>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Database
            </p>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Drizzle Demo
            </h1>
          </div>
        </header>

        <h2 className="mb-4 text-lg font-semibold text-foreground">Todos</h2>

        <ul className="mb-6 space-y-3">
          {todos.map((todo) => (
            <li key={todo.id} className="rounded-lg border bg-background px-4 py-3">
              <div className="flex items-center justify-between">
                <span className="font-medium text-foreground">{todo.title}</span>
                <span className="text-xs text-muted-foreground">#{todo.id}</span>
              </div>
            </li>
          ))}
          {todos.length === 0 && (
            <li className="rounded-lg border bg-background px-4 py-3 text-center text-muted-foreground">
              No todos yet. Create one below!
            </li>
          )}
        </ul>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-2 sm:flex-row"
        >
          <Input
            type="text"
            name="title"
            placeholder="Add a new todo..."
            className="min-w-0 flex-1"
          />
          <Button type="submit" className="whitespace-nowrap">
            Add Todo
          </Button>
        </form>

        <div className="mt-8 rounded-lg border bg-muted/40 p-4">
          <h3 className="mb-2 text-base font-semibold text-foreground">
            Powered by Drizzle ORM
          </h3>
          <p className="mb-4 text-sm text-muted-foreground">
            Next-generation ORM for Node.js & TypeScript with PostgreSQL
          </p>
          <div className="space-y-2 text-sm">
            <p className="font-medium text-foreground">Setup Instructions:</p>
            <ol className="list-inside list-decimal space-y-2 text-muted-foreground">
              <li>
                Copy <code>.env.example</code> → <code>.env.local</code>{' '}
                (DATABASE_URL already targets the local container)
              </li>
              <li>
                Start Postgres: <code>pnpm db:up</code>
              </li>
              <li>
                Apply schema: <code>pnpm db:setup</code>
              </li>
              <li>
                Optional: <code>pnpm db:studio</code>
              </li>
            </ol>
          </div>
        </div>
      </section>
    </main>
  )
}
