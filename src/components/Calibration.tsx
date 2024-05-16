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
import { Tooltip } from "flowbite-react";
import { getDeviceCalib, setDeviceCalib } from "../utils/device_info_util";
import { error } from "tauri-plugin-log-api";

import { MkDeviceCell } from "../DataTypes";
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

const Calibration: React.FC = () => {
  const [data, setData] = useState<MkDeviceCell[]>(() => []);
  const [shouldSkipPageReset, setShouldSkipPageReset] = useState(false);
  const [errorList, setErrorList] = useState<number[]>([]);

  const { currentMode, isConnected } = useContext(ConnectionContext);
  const [_editable, setEditable] = useState<number[]>(() => []);
  const [_locked, setLocked] = useState<number[]>(() => []);

  useEffect(() => {
    setShouldSkipPageReset(false);
  }, [data]);

  useEffect(() => {
    setData([]);
  }, [isConnected, currentMode]);

  const readCalibFunc = async () => {
    await invoke("stop_communication_task", {});
    await readCalib();
    await invoke("start_communication_task", {});
  };

  const readCalib = () => {
    setData([]);

    let data = getDeviceCalib()
      .then((result) => {
        setData(result.calibration_cells.filter((item, _) => result.c_editable_cells.includes(item.address))
        .map((item, _) => ({
            ...item,
            editable: !result.c_locked_cells.includes(item.address)
        })));
        setEditable(result.c_editable_cells);
        setLocked(result.c_locked_cells);
      })
      .catch((err) => {
        alert("No matching RMD file available");
        error(`Error occurred while trying to read device calibration: ${err}`);
      });

    return data;
  };

  const writeCalibBtnFunc = async () => {
    if (errorList.length > 0) {
      await message(
        `Incorrect parameters for the following calibration memory addresses:\n${errorList.join(
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
    let success = await setDeviceCalib(data);
    if (success) {
      await readCalib();
    }
    await invoke("start_communication_task", {});
  };

  const factoryResetBtnFunc = async () => {
    let result = await ask(
      "This action will factory reset the device config & calibration memory, and cannot be reverted. Are you sure?",
      {
        title: "Tiny CC Tool",
        type: "warning",
      }
    );
    if (result) {
      await invoke("stop_communication_task", {});
      if (await invoke("factory_reset", {})) {
        await readCalib();
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
                <div className="text-center text-xs w-full lg:ml-16">
                  {`${name}`}
                </div>
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
          row.editable
        ],
        id: "current_value",
        cell: ({ getValue, column: { id }, table }) => {
          const [initialValue, minValue, maxValue, allowedValues, address, editable] =
            getValue() as [number, number, number, number[], number, boolean];

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
                disabled={!editable}
                className={`${
                  errorList.includes(address) &&
                  "border border-red-500 bg-red-100"
                } text-center ${ !editable && "hover:cursor-not-allowed" }`}
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
      <div className="text-left text-xs">
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
    if (data.length > 0 && isConnected && currentMode === 'configuration') {
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
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className="border border-separate text-xs text-center"
              >
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

  let tableActionButtonClass =
    " bg-blue-700 text-white text-xs border  border-blue-950 p-1 hover:bg-blue-900  ";

  return (
    <div className="h-[50vh] flex flex-col border rounded-lg ">
      <ConfigTableContext.Provider
        value={{
          errorList: errorList,
          setErrorList: setErrorList,
        }}
      >
        <div className="overflow-y-scroll h-full">{showTable(data)}</div>
      </ConfigTableContext.Provider>
      {currentMode === "configuration" ? (
        <div className="p-[1vh] bg-gray-50 border rounded-t-none rounded-lg sticky bottom-0 h-[6vh] lg:h-[5vh]">
          <div>
            <button
              onClick={() => readCalibFunc()}
              className={`${tableActionButtonClass} rounded-l-lg `}
            >
              Read Calib
            </button>
            <button
              onClick={() => writeCalibBtnFunc()}
              className={`${tableActionButtonClass} border-l-0 `}
            >
              Save Calib
            </button>
            <button
              onClick={() => factoryResetBtnFunc()}
              className={`${tableActionButtonClass} border-l-0 rounded-r-lg`}
            >
              Factory Reset
            </button>
          </div>
        </div>
      ) : (
        <></>
      )}
    </div>
  );
};

export default Calibration;
