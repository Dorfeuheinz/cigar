import { Button } from "flowbite-react";
import Chart from "react-google-charts";
import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api";

import { getRSSI } from "../utils/device_info_util";

const switchToChannel = async (channel: number) => {
  // convert channel to hex
  let channelHex = channel.toString(16).padStart(2, "0");
  let inputStr = `'0x${channelHex}'`;

  let sendBytesResult: boolean = await invoke("send_bytes", {
    input: "C",
  });
  let readBytesResult: number[] = await invoke("read_bytes", {});
  if (
    sendBytesResult &&
    readBytesResult.length > 0 &&
    readBytesResult[0] === 62
  ) {
    let sendBytesResult2: boolean = await invoke("send_bytes", {
      input: inputStr,
    });
    let readBytesResult2: number[] = await invoke("read_bytes", {});
    if (
      sendBytesResult2 &&
      readBytesResult2.length > 0 &&
      readBytesResult2[0] === 62
    ) {
      return true;
    }
  }
  return false;
};

const RSSIChart: React.FC = () => {
  const [intervalRunning, setIntervalRunning] = useState(false);
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);
  const [sendInterval, setSendInterval] = useState(1000);
  const [currentChannel, setCurrentChannel] = useState(0);

  const [chartOptions, setChartOptions] = useState<any>({
    chart: {
      title: "RSSI Spectrum Analyzer",
      subtitle: "RSSI trends for different channels",
    },
  });

  const [chartData, setChartData] = useState([
    ["Channel", "RSSI"],
    [1, 1],
    [2, 2],
    [3, 3],
    [4, 4],
    [5, 5],
    [6, 6],
    [7, 7],
    [8, 8],
    [9, 9],
    [10, 10],
  ]);

  const handleDecrementInterval = () => {
    if (sendInterval > 1) {
      setSendInterval(sendInterval - 1);
    }
  };

  const handleIncrementInterval = () => {
    setSendInterval(sendInterval + 1);
  };

  const handleSubmit = async () => {
    setCurrentChannel((currentChannel + 1) % 10 == 0 ? 1 : currentChannel + 1);
    console.info(`Switching to channel ${currentChannel}`);
    if (await switchToChannel(currentChannel)) {
      // console.info(`RSSI for channel ${currentChannel}: ${await getRSSI()}`);
    }

    setChartData([
      ["Channel", "RSSI"],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 5],
      [5, 6],
      [6, 7],
      [7, 8],
      [8, 9],
      [9, 1],
      [10, 2],
    ]);
  };

  const handleRepeatToggle = () => {
    if (intervalRunning) {
      clearInterval(intervalId!);
      setIntervalRunning(false);
      setSendInterval(sendInterval); // Reset the interval to default value
    } else {
      const id = setInterval(async () => {
        await handleSubmit();
      }, sendInterval);
      setIntervalId(id);
      setIntervalRunning(true);
    }
  };

  useEffect(() => {
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [intervalId]);

  return (
    <>
      <Chart
        chartType="Bar"
        data={chartData}
        width="100%"
        height="80%"
        options={chartOptions}
      />
      <Button onClick={handleRepeatToggle}>
        {intervalRunning ? "Cancel" : "Start Analysis"}
      </Button>
    </>
  );
};

export default RSSIChart;
