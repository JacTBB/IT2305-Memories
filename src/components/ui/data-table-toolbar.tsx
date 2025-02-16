'use client';

import { Table } from '@tanstack/react-table';

import { DataTableViewOptions } from '@/components/ui/data-table-view-options';
import { Input } from '@/components/ui/input';

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  searchTitle?: string;
  searchColumn?: string;
  toolbarChildren?: React.ReactNode;
}

export function DataTableToolbar<TData>({
  table,
  searchTitle,
  searchColumn,
  toolbarChildren,
}: DataTableToolbarProps<TData>) {
  return (
    <div className="flex items-center py-4 justify-between">
      <div className="flex flex-1 items-center space-x-2">
        {searchColumn && (
          <Input
            placeholder={searchTitle}
            value={(table.getColumn(searchColumn)?.getFilterValue() as string) ?? ''}
            onChange={(event) => table.getColumn(searchColumn)?.setFilterValue(event.target.value)}
            className="h-8 w-[150px] lg:w-[250px]"
          />
        )}
      </div>
      {toolbarChildren}
      <DataTableViewOptions table={table} />
    </div>
  );
}
