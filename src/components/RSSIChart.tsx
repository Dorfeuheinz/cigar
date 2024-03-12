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

  const [chartOptions, setChartOptions] = useState<any>({
    chart: {
      title: "RSSI Spectrum Analyzer",
      subtitle: "RSSI trends for different channels",
    },
  });

  const [chartData, setChartData] = useState([
    ["Channel", "RSSI"],
    [1, -100],
    [2, -100],
    [3, -100],
    [4, -100],
    [5, -100],
    [6, -100],
    [7, -100],
    [8, -100],
    [9, -100],
    [10, -100],
  ]);

  useEffect(() => {
    const unlisten = listen<RSSIEvent>("rssi_event", (event) => {
      setChartData((prevData) => {
        return prevData.map((row) => {
          if (row[0] === event.payload.channel) {
            return [row[0], event.payload.rssi];
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

  const handleSubmit = async () => {
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
    if (rssiStreamRunning) {
      setRSSIStreamRunning(false);
    } else {
      invoke("start_rssi_stream", {}).then(() => {
        // do nothing
      });
      setRSSIStreamRunning(true);
    }
  };

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
        {rssiStreamRunning ? "Cancel" : "Start Analysis"}
      </Button>
    </>
  );
};

export default RSSIChart;
