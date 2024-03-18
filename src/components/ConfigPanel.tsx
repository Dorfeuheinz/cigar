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
import { error } from "tauri-plugin-log-api";

import {
  MkDeviceCell,
  MkDeviceTestMode,
  MkDeviceQuickMode,
} from "../DataTypes";

declare module "@tanstack/react-table" {
  interface TableMeta<TData extends RowData> {
    updateData: (rowIndex: number, columnId: string, value: unknown) => void;
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
    getDeviceConfig()
      .then((result) => {
        setData(result.cells);
        setTestModeOptions(result.test_modes);
        setQuickModeOptions(result.quick_modes);
      })
      .catch((err) => {
        error(`Error occurred while trying to read device config: ${err}`);
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
    _columnId: string,
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
      updateData: (rowIndex, columnId, value) => {
        handleCellValueChange(rowIndex, columnId, value as string);
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

  function showTable(data: Array<object>) {
    if (data.length > 0) {
      return (
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
      );
    } else {
      return <div className="bg-gray-100 h-full"></div>;
    }
  }

  return (
    <div className="h-full flex flex-col border rounded-lg">
      <div className="overflow-y-scroll h-full">{showTable(data)}</div>
      <div className="p-2 bg-gray-50 border rounded-t-none rounded-lg sticky bottom-0 flex flex-row justify-between md:flex-wrap">
        <div>
          <button
            onClick={() => readConfig()}
            className=" bg-blue-700 text-white text-xs p-2 border border-blue-950 rounded-l-lg hover:bg-blue-900 md:text-xs lg:text-lg"
          >
            Read Config
          </button>
          <button
            onClick={() => writeConfig()}
            className=" bg-blue-700 text-white  border border-l-0 border-blue-950 text-xs p-2 hover:bg-blue-900 md:text-xs lg:text-lg"
          >
            Save Config
          </button>
          <button
            onClick={() => factoryReset()}
            className=" bg-blue-700 text-white text-xs border border-l-0 border-blue-950 rounded-r-lg p-2 hover:bg-blue-900 md:text-xs lg:text-lg"
          >
            Factory Reset
          </button>
        </div>
        <div className="float right md:mt-2">
          <TestModeSelect
            testModeOptions={testModeOptions}
            quickOptions={quickModeOptions}
          />
        </div>
      </div>
    </div>
  );
};

export default ConfigPanel;
