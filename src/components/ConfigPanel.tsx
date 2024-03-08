import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";

import React, { useState } from "react";
import { invoke } from "@tauri-apps/api";

async function getDeviceConfig() {
  let result: MkDeviceConfig = await invoke("get_device_config");
  return result;
}

type MkDeviceConfig = {
  model: string;
  hw_version: string;
  firmware_version: string;
  cells: MkDeviceCell[];
};

type MkDeviceCell = {
  address: number;
  name: string;
  description: string;
  min_value: number;
  max_value: number;
  allowed_values: number[];
  default_value: number;
  current_value: number;
};

const columnHelper = createColumnHelper<MkDeviceCell>();

const columns = [
  columnHelper.accessor((row) => row.address, {
    id: "Address",
    cell: (info) => <i>{info.getValue()}</i>,
    header: () => <span>Address</span>,
    footer: (info) => info.column.id,
  }),
  columnHelper.accessor((row) => row.name, {
    id: "Name",
    cell: (info) => info.getValue(),
    header: () => <span>Name</span>,
    footer: (info) => info.column.id,
  }),
  // columnHelper.accessor((row) => row.description, {
  //   id: "Description",
  //   cell: (info) => info.getValue(),
  //   header: () => <span>Description</span>,
  //   footer: (info) => info.column.id,
  // }),
  columnHelper.accessor((row) => row.current_value, {
    id: "Current Value",
    cell: (info) => info.getValue(),
    header: () => <span>Current Value</span>,
    footer: (info) => info.column.id,
  }),
];

const ConfigPanel: React.FC = () => {
  const [data, setData] = useState<MkDeviceCell[]>(() => []);
  const rerender = () => {
    getDeviceConfig().then((result) => {
      console.log(JSON.stringify(result));
      setData(result.cells);
    });
  };

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="p-2">
      <table>
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        <tfoot>
          {table.getFooterGroups().map((footerGroup) => (
            <tr key={footerGroup.id}>
              {footerGroup.headers.map((header) => (
                <th key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.footer,
                        header.getContext()
                      )}
                </th>
              ))}
            </tr>
          ))}
        </tfoot>
      </table>
      <div className="h-4" />
      <button onClick={() => rerender()} className="border p-2">
        Rerender
      </button>
    </div>
  );
};

export default ConfigPanel;
