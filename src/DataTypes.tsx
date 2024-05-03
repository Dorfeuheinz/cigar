type MkDeviceConfig = {
  locked_cells: number[];
  editable_cells: number[];
  model: string;
  hw_version: string;
  firmware_version: string;
  cells: MkDeviceCell[];
  test_modes: MkDeviceTestMode[];
  quick_modes: MkDeviceQuickMode[];
};

type MkDeviceCalib = {
  calibration_cells: MkDeviceCell[];
  c_locked_cells: number[];
  c_editable_cells: number[];
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
  editable: boolean;
};

type MkDeviceTestMode = {
  testmode_id: number;
  name: string;
  description: string;
  sequence_on: string;
  sequence_off: string;
};

type MkDeviceQuickMode = {
  testmode_id: number;
  name: string;
  description: string;
  sequence_on: string;
  sequence_off: string;
};

export type {
  MkDeviceConfig,
  MkDeviceCell,
  MkDeviceTestMode,
  MkDeviceQuickMode,
  MkDeviceCalib
};
