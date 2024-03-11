import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";

import React, { useState } from "react";
import { invoke } from "@tauri-apps/api";
import { ask } from "@tauri-apps/api/dialog";
import TestModeSelect from "./TestModeSelect";

import {
  MkDeviceCell,
  MkDeviceConfig,
  MkDeviceTestMode,
  MkDeviceQuickMode,
} from "../DataTypes";

async function getDeviceConfig() {
  let result: MkDeviceConfig = await invoke("get_device_config");
  return result;
}

const columnHelper = createColumnHelper<MkDeviceCell>();

const ConfigPanel: React.FC = () => {
  const [data, setData] = useState<MkDeviceCell[]>(() => []);
  const [testModeOptions, setTestModeOptions] = useState<MkDeviceTestMode[]>(
    []
  );
  const [quickModeOptions, setQuickModeOptions] = useState<MkDeviceQuickMode[]>(
    []
  );
  const readConfig = () => {
    getDeviceConfig().then((result) => {
      setData(result.cells);
      setTestModeOptions(result.test_modes);
      setQuickModeOptions(result.quick_modes);
    });
  };

  const writeConfig = () => {};

  const factoryReset = () => {
    ask(
      "This action will factory reset the device and cannot be reverted. Are you sure?",
      {
        title: "Tiny CC Tool",
        type: "warning",
      }
    ).then((result) => {
      console.info(`User said ${result}`);
    });
  };

  const handleCellValueChange = (
    rowId: string,
    columnId: string,
    value: string
  ) => {
    console.info(`Setting cell ${rowId} ${columnId} to ${value}`);
    setData((old) =>
      old.map((row) =>
        row.address == parseInt(rowId)
          ? { ...row, current_value: parseInt(value) }
          : row
      )
    );
  };

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
    columnHelper.accessor((row) => row.current_value, {
      id: "Current Value",
      cell: (info) => (
        <input
          value={info.getValue()}
          onChange={(e) =>
            handleCellValueChange(info.row.id, info.column.id, e.target.value)
          }
        />
      ),
      header: () => <span>Current Value</span>,
      footer: (info) => info.column.id,
    }),
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="p-2">
      <table className="w-full h-96">
        <thead className="sticky top-0 bg-white">
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
        <tbody className="overflow-y-auto">
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
      </table>
      <div className="h-4">
        <button onClick={() => readConfig()} className="border p-2">
          Read Config
        </button>
        <button onClick={() => writeConfig()} className="border p-2">
          Save Config
        </button>
        <button onClick={() => factoryReset()} className="border p-2">
          Factory Reset
        </button>
        <TestModeSelect
          testModeOptions={testModeOptions}
          quickOptions={quickModeOptions}
        />
      </div>
    </div>
  );
};

export default ConfigPanel;
