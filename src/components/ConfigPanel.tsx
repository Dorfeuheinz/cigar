import {
  RowData,
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";

import React, { useState, useEffect, useMemo } from "react";
import { invoke } from "@tauri-apps/api";
import { ask } from "@tauri-apps/api/dialog";
import TestModeSelect from "./TestModeSelect";
import { Tooltip } from "flowbite-react";
import { getDeviceConfig, setDeviceConfig } from "../utils/device_info_util";

import {
  MkDeviceCell,
  MkDeviceTestMode,
  MkDeviceQuickMode,
} from "../DataTypes";

declare module "@tanstack/react-table" {
  interface TableMeta<TData extends RowData> {
    updateData: (rowIndex: number, columnId: string, value: string) => void;
  }
}

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

  const writeConfig = () => {
    setDeviceConfig(data).then((success) => {
      if (success) {
        readConfig();
      }
    });
  };

  const factoryReset = () => {
    ask(
      "This action will factory reset the device and cannot be reverted. Are you sure?",
      {
        title: "Tiny CC Tool",
        type: "warning",
      }
    ).then((result) => {
      if (result) {
        invoke("send_bytes", { input: "@TM" }).then(() => {
          invoke("read_bytes", {}).then(() => {
            readConfig();
          });
        });
      }
    });
  };

  const handleCellValueChange = (
    rowId: number,
    columnId: string,
    value: string
  ) => {
    setData((old) => {
      return old.map((row) => {
        if (row.address === rowId) {
          row.current_value = parseInt(value);
        }
        return row;
      });
    });
  };

  const columns = useMemo<ColumnDef<MkDeviceCell>[]>(
    () => [
      {
        header: "Address",
        footer: (props) => props.column.id,
        accessorFn: (row) => row.address,
        id: "address",
      },
      {
        header: "Name",
        footer: (props) => props.column.id,
        accessorFn: (row) => (
          <>
            <Tooltip
              content={toolTipData(row.description)}
              placement="right"
              style="light"
            >
              {`${row.name}`}
            </Tooltip>
          </>
        ),
        id: "name",
      },
      {
        header: "Current Value",
        footer: (props) => props.column.id,
        accessorFn: (row) => row.current_value,
        id: "current_value",
      },
    ],
    []
  );

  // Give our default column cell renderer editing superpowers!
  const defaultColumn: Partial<ColumnDef<MkDeviceCell>> = {
    cell: ({ getValue, row: { index }, column: { id }, table }) => {
      const initialValue = getValue();
      // We need to keep and update the state of the cell normally
      const [value, setValue] = useState(initialValue);

      // When the input is blurred, we'll call our table meta's updateData function
      const onBlur = () => {
        table.options.meta?.updateData(index, id, value);
      };

      // If the initialValue is changed external, sync it up with our state
      useEffect(() => {
        setValue(initialValue);
      }, [initialValue]);

      if (id === "current_value") {
        return (
          <>
            <input
              value={value as string}
              onChange={(e) => setValue(e.target.value)}
              onBlur={onBlur}
            />
          </>
        );
      } else {
        return <>{value}</>;
      }
    },
  };

  const table = useReactTable({
    data,
    columns,
    defaultColumn,
    getCoreRowModel: getCoreRowModel(),
    meta: {
      updateData(rowIndex, columnId, value) {
        handleCellValueChange(rowIndex, columnId, value);
      },
    },
    debugTable: true,
  });

  function toolTipData(description: string) {
    const array = description.split("\n");

    return (
      <div className="text-left">
        {array.map((element, index) => (
          <div key={index}>
            {element}
            <br />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-scroll border rounded-lg">
      <table className="w-full text-center table border border-collapse ">
        <thead className="sticky top-0 bg-gray-50 text-center table-header-group border border-collapse  ">
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
        <tbody className="text-center ">
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id} className="border border-separate ">
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="p-2 bg-gray-50 border rounded-t-none rounded-lg sticky bottom-0 flex flex-row justify-around sm:flex-wrap">
        <button
          onClick={() => readConfig()}
          className=" bg-blue-700 text-white border rounded-lg text-sm p-2"
        >
          Read Config
        </button>
        <button
          onClick={() => writeConfig()}
          className=" bg-blue-700 text-white border rounded-lg  text-sm p-2"
        >
          Save Config
        </button>
        <button
          onClick={() => factoryReset()}
          className=" bg-blue-700 text-white text-sm border rounded-lg  p-2"
        >
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
