import { Button } from "flowbite-react";
import Chart from "react-google-charts";
import { useState, useEffect, useContext } from "react";
import { invoke } from "@tauri-apps/api";
import { listen } from "@tauri-apps/api/event";
import { RssiStreamContext } from "./DeviceInfo";

type RSSIEvent = {
  rssi: number;
  channel: number;
};

const RSSIChart: React.FC = () => {
  const [chartOptions, _setChartOptions] = useState<any>({
    title: "RSSI Spectrum Analyzer",
    subtitle: "RSSI trends for different channels",
    isStacked: true,
    chartArea: { width: "80%" },
    legend: { position: "none" },
    colors: ["transparent", "blue"],
    hAxis: {
      title: "Channel",
    },
    vAxis: {
      title: "RSSI",
    },
  });

  const { rssiStreamRunning, setRssiStreamRunning } =
    useContext(RssiStreamContext);

  const [chartData, setChartData] = useState([
    ["Channel", "RSSI", ""],
    [1, -100, -100 - -100],
  ]);

  useEffect(() => {
    const unlisten = listen<RSSIEvent>("rssi_event", (event) => {
      setChartData((prevData) => {
        let index = prevData.findIndex(
          (row) => row[0] === event.payload.channel
        );
        let rssi = event.payload.rssi > -100 ? event.payload.rssi : -100;

        if (index === -1) {
          return prevData.concat([[event.payload.channel, rssi, -100 - rssi]]);
        } else {
          return prevData.map((row) => {
            if (row[0] === event.payload.channel) {
              return [event.payload.channel, rssi, -100 - rssi];
            } else {
              return row;
            }
          });
        }
      });
    });
    return () => {
      unlisten.then((f) => f());
    };
  }, []);

  const handleRepeatToggle = async () => {
    if (rssiStreamRunning) {
      await invoke("stop_rssi_stream", {});
      await invoke("start_communication_task", {});
      setRssiStreamRunning(false);
    } else {
      await invoke("stop_communication_task", {});
      await invoke("start_rssi_stream", {});
      setRssiStreamRunning(true);
    }
  };

  return (
    <>
      <Chart
        chartType="ColumnChart"
        data={chartData}
        width="100%"
        height="80%"
        options={chartOptions}
      />
      <Button onClick={handleRepeatToggle}>
        {rssiStreamRunning ? "Cancel" : "Start Analysis"}
      </Button>
    </>
  );
};

export default RSSIChart;
