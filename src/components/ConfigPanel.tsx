import {
  RowData,
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";

import React, {
  useState,
  useEffect,
  useMemo,
  useContext,
  createContext,
} from "react";
import { invoke } from "@tauri-apps/api";
import { ask, message } from "@tauri-apps/api/dialog";
import TestModeSelect from "./TestModeSelect";
import { Tooltip } from "flowbite-react";
import { getDeviceConfig, setDeviceConfig } from "../utils/device_info_util";
import { error } from "tauri-plugin-log-api";

import {
  MkDeviceCell,
  MkDeviceTestMode,
  MkDeviceQuickMode,
} from "../DataTypes";
import { ConnectionContext } from "../App";

const ConfigTableContext = createContext({
  errorList: [] as number[],
  setErrorList: (_: number[]) => {},
});

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
  const [shouldSkipPageReset, setShouldSkipPageReset] = useState(false);
  const [errorList, setErrorList] = useState<number[]>([]);

  useEffect(() => {
    setShouldSkipPageReset(false);
  }, [data]);
  const { setModel, setFirmware, setHardware, currentMode, isConnected } =
    useContext(ConnectionContext);

  const readConfigBtnFunc = async () => {
    await invoke("stop_communication_task", {});
    await readConfig();
    await invoke("start_communication_task", {});
  };

  const readConfig = () => {
    return getDeviceConfig()
      .then((result) => {
        setData(result.cells);
        setTestModeOptions(result.test_modes);
        setQuickModeOptions(result.quick_modes);
        setModel(result.model);
        setFirmware(result.firmware_version);
        setHardware(result.hw_version);
        setErrorList([]);
      })
      .catch((err) => {
        error(`Error occurred while trying to read device config: ${err}`);
      });
  };

  const writeConfigBtnFunc = async () => {
    if (errorList.length > 0) {
      await message(
        `Incorrect parameters for the following config memory addresses:\n${errorList.join(
          ","
        )}`,
        {
          title: "Tauri",
          type: "error",
        }
      );
      return;
    }
    await invoke("stop_communication_task", {});
    let success = await setDeviceConfig(data);
    if (success) {
      await readConfig();
    }
    await invoke("start_communication_task", {});
  };

  const factoryResetBtnFunc = async () => {
    let result = await ask(
      "This action will factory reset the device and cannot be reverted. Are you sure?",
      {
        title: "Tiny CC Tool",
        type: "warning",
      }
    );
    if (result) {
      await invoke("stop_communication_task", {});
      if (await invoke("factory_reset", {})) {
        await readConfig();
      }
      await invoke("start_communication_task", {});
    }
  };

  const handleCellValueChange = (
    rowId: number,
    _columnId: string,
    value: string
  ) => {
    setShouldSkipPageReset(true);
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
        accessorFn: (row) =>
          `0x${row.address.toString(16).padStart(2, "0").toUpperCase()}`,
        id: "address",
      },
      {
        header: "Name",
        footer: (props) => props.column.id,
        accessorFn: (row) => [row.name, row.description],
        id: "name",
        cell: ({ getValue }) => {
          const [name, description] = getValue() as [string, string];
          return (
            <>
              <Tooltip
                content={toolTipData(description)}
                placement="right"
                style="light"
              >
                {`${name}`}
              </Tooltip>
            </>
          );
        },
      },
      {
        header: "Current Value",
        footer: (props) => props.column.id,
        accessorFn: (row) => [
          row.current_value,
          row.min_value,
          row.max_value,
          row.allowed_values,
          row.address,
        ],
        id: "current_value",
        cell: ({ getValue, column: { id }, table }) => {
          const [initialValue, minValue, maxValue, allowedValues, address] =
            getValue() as [number, number, number, number[], number];

          const [value, setValue] = useState(initialValue.toString());
          const { errorList, setErrorList } = useContext(ConfigTableContext);

          // When the input is blurred, we'll call our table meta's updateData function
          const onBlur = () => {
            const val = parseInt(value || "");
            table.options.meta?.updateData(address, id, val);
            if (allowedValues.includes(val)) {
              setErrorList(errorList.filter((e) => e !== address));
            } else if (val >= minValue && val <= maxValue) {
              setErrorList(errorList.filter((e) => e !== address));
            } else {
              setErrorList(errorList.filter((e) => e !== address));
              setErrorList([...errorList, address]);
            }
          };

          const handleOnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            setValue(e.target.value);
          };

          // If the initialValue is changed external, sync it up with our state
          useEffect(() => {
            setValue(initialValue.toString());
          }, [initialValue]);

          return (
            <>
              <input
                value={value}
                onChange={handleOnChange}
                onBlur={onBlur}
                className={`${
                  errorList.includes(address) &&
                  "border border-red-500 bg-red-100"
                }`}
              />
            </>
          );
        },
      },
    ],
    []
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    autoResetPageIndex: !shouldSkipPageReset,
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
    if (data.length > 0 && isConnected) {
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
      <ConfigTableContext.Provider
        value={{
          errorList: errorList,
          setErrorList: setErrorList,
        }}
      >
        <div className="overflow-y-scroll h-full">{showTable(data)}</div>
      </ConfigTableContext.Provider>
      <div
        className={` p-2 bg-gray-50 border rounded-t-none rounded-lg sticky bottom-0 flex flex-row justify-between md:flex-wrap ${
          currentMode == "configuration" ? "" : "hidden"
        } `}
      >
        <div>
          <button
            onClick={() => readConfigBtnFunc()}
            className=" bg-blue-700 text-white text-xs p-2 border border-blue-950 rounded-l-lg hover:bg-blue-900 md:text-xs lg:text-lg"
          >
            Read Config
          </button>
          <button
            onClick={() => writeConfigBtnFunc()}
            className=" bg-blue-700 text-white  border border-l-0 border-blue-950 text-xs p-2 hover:bg-blue-900 md:text-xs lg:text-lg"
          >
            Save Config
          </button>
          <button
            onClick={() => factoryResetBtnFunc()}
            className=" bg-blue-700 text-white text-xs border border-l-0 border-blue-950 rounded-r-lg p-2 hover:bg-blue-900 md:text-xs lg:text-lg"
          >
            Factory Reset
          </button>
        </div>
        <div className={`float right md:mt-2`}>
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
