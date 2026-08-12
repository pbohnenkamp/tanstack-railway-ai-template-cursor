import React from 'react'
import { createFileRoute } from '@tanstack/react-router'
import {
  columnFilteringFeature,
  createColumnHelper,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  filterFn_equalsString,
  filterFn_includesString,
  filterFn_includesStringSensitive,
  globalFilteringFeature,
  metaHelper,
  rowPaginationFeature,
  rowSortingFeature,
  sortFn_alphanumeric,
  sortFn_text,
  tableFeatures,
  useTable,
} from '@tanstack/react-table'
import { compareItems, rankItem } from '@tanstack/match-sorter-utils'

import { makeData } from '#/data/demo-table-data'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'

import type {
  Column,
  FilterFn,
  SortFn,
  TableFeatures,
} from '@tanstack/react-table'
import type { RankingInfo } from '@tanstack/match-sorter-utils'

import type { Person } from '#/data/demo-table-data'

export const Route = createFileRoute('/demo/table')({
  component: TableDemo,
})

interface FuzzyFilterMeta {
  itemRank?: RankingInfo
}

/** Broad features type for custom fns before `features` exists. */
type FuzzyFeatures = TableFeatures & { filterMeta: FuzzyFilterMeta }

const fuzzyFilter: FilterFn<FuzzyFeatures, Person> = (
  row,
  columnId,
  value,
  addMeta,
) => {
  const itemRank = rankItem(row.getValue(columnId), value)

  addMeta?.({ itemRank })

  return itemRank.passed
}

const fuzzySort: SortFn<FuzzyFeatures, Person> = (rowA, rowB, columnId) => {
  let dir = 0

  if (rowA.columnFiltersMeta[columnId]) {
    dir = compareItems(
      rowA.columnFiltersMeta[columnId].itemRank as RankingInfo,
      rowB.columnFiltersMeta[columnId].itemRank as RankingInfo,
    )
  }

  return dir === 0 ? sortFn_alphanumeric(rowA, rowB, columnId) : dir
}

const features = tableFeatures({
  columnFilteringFeature,
  globalFilteringFeature,
  rowSortingFeature,
  rowPaginationFeature,
  filteredRowModel: createFilteredRowModel(),
  sortedRowModel: createSortedRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
  filterFns: {
    equalsString: filterFn_equalsString,
    includesString: filterFn_includesString,
    includesStringSensitive: filterFn_includesStringSensitive,
    fuzzy: fuzzyFilter,
  },
  sortFns: {
    alphanumeric: sortFn_alphanumeric,
    text: sortFn_text,
    fuzzy: fuzzySort,
  },
  filterMeta: metaHelper<FuzzyFilterMeta>(),
})

const columnHelper = createColumnHelper<typeof features, Person>()

const columns = columnHelper.columns([
  columnHelper.accessor('id', {
    filterFn: 'equalsString',
  }),
  columnHelper.accessor('firstName', {
    cell: (info) => info.getValue(),
    filterFn: 'includesStringSensitive',
  }),
  columnHelper.accessor((row) => row.lastName, {
    id: 'lastName',
    cell: (info) => info.getValue(),
    header: () => <span>Last Name</span>,
    filterFn: 'includesString',
  }),
  columnHelper.accessor((row) => `${row.firstName} ${row.lastName}`, {
    id: 'fullName',
    header: 'Full Name',
    cell: (info) => info.getValue(),
    filterFn: 'fuzzy',
    sortFn: 'fuzzy',
  }),
])

function TableDemo() {
  const rerender = React.useReducer(() => ({}), {})[1]

  const [data, setData] = React.useState<Person[]>(() => makeData(5_000))
  const refreshData = () => setData(() => makeData(50_000))

  const table = useTable({
    features,
    columns,
    data,
    globalFilterFn: 'fuzzy',
    debugTable: true,
    debugHeaders: true,
    debugColumns: false,
  })

  // Prefer fuzzy rank order while the fullName column filter is active.
  const fullNameFilterActive = table.state.columnFilters[0]?.id === 'fullName'
  const fullNameSortActive = table.state.sorting[0]?.id === 'fullName'
  React.useEffect(() => {
    if (fullNameFilterActive && !fullNameSortActive) {
      table.setSorting([{ id: 'fullName', desc: false }])
    }
  }, [fullNameFilterActive, fullNameSortActive, table])

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-10">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          TanStack Table
        </p>
        <h1 className="mb-6 text-2xl font-bold tracking-tight text-foreground">
          Table Demo
        </h1>
        <DebouncedInput
          value={table.state.globalFilter ?? ''}
          onChange={(value) => table.setGlobalFilter(String(value))}
          className="max-w-sm"
          placeholder="Search all columns..."
        />
      </div>
      <div className="overflow-hidden rounded-xl border bg-card text-card-foreground shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full caption-bottom text-sm">
            <thead className="border-b bg-muted/50">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <th
                        key={header.id}
                        colSpan={header.colSpan}
                        className="h-10 px-4 py-3 text-left align-middle font-medium text-muted-foreground"
                      >
                        {header.isPlaceholder ? null : (
                          <>
                            <div
                              className={
                                header.column.getCanSort()
                                  ? 'cursor-pointer select-none transition-colors hover:text-foreground'
                                  : ''
                              }
                              onClick={header.column.getToggleSortingHandler()}
                            >
                              <table.FlexRender header={header} />
                              {{
                                asc: ' 🔼',
                                desc: ' 🔽',
                              }[header.column.getIsSorted() as string] ?? null}
                            </div>
                            {header.column.getCanFilter() ? (
                              <div className="mt-2">
                                <Filter column={header.column} />
                              </div>
                            ) : null}
                          </>
                        )}
                      </th>
                    )
                  })}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row) => {
                return (
                  <tr
                    key={row.id}
                    className="border-b transition-colors hover:bg-muted/50"
                  >
                    {row.getAllCells().map((cell) => {
                      return (
                        <td
                          key={cell.id}
                          className="px-4 py-3 align-middle text-foreground"
                        >
                          <table.FlexRender cell={cell} />
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.firstPage()}
          disabled={!table.getCanPreviousPage()}
        >
          {'<<'}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          {'<'}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          {'>'}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.lastPage()}
          disabled={!table.getCanLastPage()}
        >
          {'>>'}
        </Button>
        <span className="flex items-center gap-1">
          <div>Page</div>
          <strong className="text-foreground">
            {table.state.pagination.pageIndex + 1} of {table.getPageCount()}
          </strong>
        </span>
        <span className="flex items-center gap-1">
          | Go to page:
          <Input
            type="number"
            defaultValue={table.state.pagination.pageIndex + 1}
            onChange={(e) => {
              const page = e.target.value ? Number(e.target.value) - 1 : 0
              table.setPageIndex(page)
            }}
            className="h-8 w-16"
          />
        </span>
        <select
          value={table.state.pagination.pageSize}
          onChange={(e) => {
            table.setPageSize(Number(e.target.value))
          }}
          className="h-8 rounded-md border border-input bg-transparent px-2 text-sm text-foreground shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          {[10, 20, 30, 40, 50].map((pageSize) => (
            <option key={pageSize} value={pageSize}>
              Show {pageSize}
            </option>
          ))}
        </select>
      </div>
      <div className="text-sm text-muted-foreground">
        {table.getPrePaginatedRowModel().rows.length} Rows
      </div>
      <div className="flex gap-2">
        <Button onClick={() => rerender()}>Force Rerender</Button>
        <Button onClick={() => refreshData()}>Refresh Data</Button>
      </div>
      <pre className="overflow-auto rounded-xl border bg-muted p-4 text-xs text-foreground">
        {JSON.stringify(
          {
            columnFilters: table.state.columnFilters,
            globalFilter: table.state.globalFilter,
          },
          null,
          2,
        )}
      </pre>
    </main>
  )
}

function Filter({
  column,
}: {
  column: Column<typeof features, Person, unknown>
}) {
  const columnFilterValue = column.getFilterValue()

  return (
    <DebouncedInput
      type="text"
      value={(columnFilterValue ?? '') as string}
      onChange={(value) => column.setFilterValue(value)}
      placeholder={`Search...`}
      className="h-8"
    />
  )
}

function DebouncedInput({
  value: initialValue,
  onChange,
  debounce = 500,
  className,
  ...props
}: {
  value: string | number
  onChange: (value: string | number) => void
  debounce?: number
} & Omit<React.ComponentProps<typeof Input>, 'onChange'>) {
  const [value, setValue] = React.useState(initialValue)
  // Keep the latest onChange without re-arming the debounce timer on every
  // parent render. Re-firing setGlobalFilter/setFilterValue resets pageIndex.
  const onChangeRef = React.useRef(onChange)
  onChangeRef.current = onChange
  const isFirstEmit = React.useRef(true)

  React.useEffect(() => {
    setValue(initialValue)
  }, [initialValue])

  React.useEffect(() => {
    if (isFirstEmit.current) {
      isFirstEmit.current = false
      return
    }

    const timeout = setTimeout(() => {
      onChangeRef.current(value)
    }, debounce)

    return () => clearTimeout(timeout)
  }, [value, debounce])

  return (
    <Input
      {...props}
      className={className}
      value={value}
      onChange={(e) => setValue(e.target.value)}
    />
  )
}
