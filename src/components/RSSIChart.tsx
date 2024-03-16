import { Button } from "flowbite-react";
import Chart from "react-google-charts";
import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api";
import { listen } from "@tauri-apps/api/event";

type RSSIEvent = {
  rssi: number;
  channel: number;
};

const RSSIChart: React.FC = () => {
  const [rssiStreamRunning, setRSSIStreamRunning] = useState(false);

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

  const [chartData, setChartData] = useState([
    ["Channel", "RSSI", ""],
    [1, -100, -100 - -100],
    [2, -100, -100 - -100],
    [3, -100, -100 - -100],
    [4, -100, -100 - -100],
    [5, -100, -100 - -100],
    [6, -100, -100 - -100],
    [7, -100, -100 - -100],
    [8, -80, -100 - -80],
    [9, -100, -100 - -100],
    [10, -100, -100 - -100],
  ]);

  useEffect(() => {
    const unlisten = listen<RSSIEvent>("rssi_event", (event) => {
      setChartData((prevData) => {
        return prevData.map((row) => {
          if (row[0] === event.payload.channel) {
            let rssi = event.payload.rssi > -100 ? event.payload.rssi : -100;
            return [row[0], rssi, -100 - rssi];
          } else {
            return row;
          }
        });
      });
    });
    return () => {
      unlisten.then((f) => f());
    };
  }, []);

  const handleRepeatToggle = () => {
    if (rssiStreamRunning) {
      invoke("stop_rssi_stream", {}).then(() => {
        // do nothing for now
      });
      setRSSIStreamRunning(false);
    } else {
      invoke("start_rssi_stream", {}).then(() => {
        // do nothing for now
      });
      setRSSIStreamRunning(true);
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
