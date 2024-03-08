import Chart from "react-apexcharts";

const RSSIChart: React.FC = () => {
  const state = {
    options: {
      chart: {
        id: "apexchart-example",
      },
      xaxis: {
        categories: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      },
    },
    series: [
      {
        name: "RSSI",
        data: [1, 2, 3, 4, 5, 6, 7, 6, 5, 4],
      },
    ],
  };
  return (
    <Chart
      options={state.options}
      series={state.series}
      type="bar"
      width={500}
      height={320}
    />
  );
};

export default RSSIChart;
