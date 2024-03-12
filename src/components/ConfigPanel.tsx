import {
  RowData,
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";

import React, { useState } from "react";
import { invoke } from "@tauri-apps/api";
import { ask } from "@tauri-apps/api/dialog";
import TestModeSelect from "./TestModeSelect";
import { Tooltip } from "flowbite-react";

import {
  MkDeviceCell,
  MkDeviceConfig,
  MkDeviceTestMode,
  MkDeviceQuickMode,
} from "../DataTypes";

declare module "@tanstack/react-table" {
  interface TableMeta<TData extends RowData> {
    updateData: (rowIndex: number, columnId: string, value: unknown) => void;
  }
}

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
    rowId: string,
    columnId: string,
    value: string
  ) => {
    console.info(`Setting cell ${rowId} ${columnId} to ${value}`);
    setData((old) => {
      return old.map((row) => {
        if (row.address === parseInt(rowId)) {
          row.current_value = parseInt(value);
        }
        return row;
      });
    });
  };

  const columns = [
    columnHelper.accessor((row) => row.address, {
      id: "Address",
      cell: (info) => <i>{info.getValue()}</i>,
      header: () => <div>Address</div>,
      footer: (info) => info.column.id,
    }),
    columnHelper.accessor((row) => row.name, {
      id: "Name",
      cell: (info) => (
        <Tooltip
          content={toolTipData(data[parseInt(info.row.id)].description)}
          placement="right"
          style="light"
        >
          {info.getValue()}
        </Tooltip>
      ),
      header: () => <div>Name</div>,

      footer: (info) => info.column.id,
    }),
    columnHelper.accessor((row) => row.current_value, {
      id: "Current Value",
      cell: (info) => (
        <input
          value={info.getValue()}
          onBlur={(e) =>
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

  function toolTipData(discription: string) {
    const array = discription.split("\n");

    return (
      <div className="text-left">
        {array.map((element) => (
          <>
            {element}
            <br />
          </>
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
