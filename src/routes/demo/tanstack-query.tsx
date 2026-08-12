import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'

export const Route = createFileRoute('/demo/tanstack-query')({
  component: TanStackQueryDemo,
})

function TanStackQueryDemo() {
  const { data } = useQuery({
    queryKey: ['todos'],
    queryFn: () =>
      Promise.resolve([
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
        { id: 3, name: 'Charlie' },
      ]),
    initialData: [],
  })

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col px-4 py-10">
      <section className="w-full rounded-xl border bg-card p-6 text-card-foreground shadow-sm">
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          TanStack Query
        </p>
        <h1 className="mb-6 text-2xl font-bold tracking-tight text-foreground">
          TanStack Query Simple Promise Handling
        </h1>
        <ul className="mb-4 space-y-2">
          {data.map((todo) => (
            <li
              key={todo.id}
              className="rounded-lg border bg-background px-4 py-3"
            >
              <span className="text-base font-medium text-foreground">
                {todo.name}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  )
}
