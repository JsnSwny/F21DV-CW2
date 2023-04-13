// Gets map data from github URL
let data = [];
let filteredData = [];
let mapSvg = null;
let projection = null;
let plotColor = null;
let radiusScale = null;
let mapData;
let plots;
let points;
let filteredPoints;
let selectedPoint;
let languagesChart;
let selectedLanguage;
let networkLines;
let population;
let filterDateMin;
let selectedCountry;
let sidebarDom = document.getElementById("sidebar");
let scatterData;

// COLORS
// -------
const getData = async () => {
  data = await d3.json("data-16.json");
  filteredData = data;
};

const updateData = () => {
  filterData();
  updateChart();
  updatePoints(filteredData);
  languagesChart.updateChart(filteredData);
  loadGDP();
  updateSummary();
};

// -----------------------

// CHART TAB
// -----------------------

const loadChart = () => {
  d3.select("#timeline").selectAll("svg").remove();
  d3.select("#legend-container").selectAll("div").remove();
  mapWidth = document.querySelector(".map").offsetWidth;
  const margin = { top: 10, right: 32, bottom: 30, left: 64 },
    width = mapWidth - margin.left - margin.right,
    height = 200 - margin.top - margin.bottom;

  const lineSvg = d3
    .select("#timeline")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);
  const legend = d3.select("#legend-container");

  d3.select("#view svg")
    .append("text")
    .attr("x", width / 2 + 100)
    .attr("y", height + 80)
    .attr("text-anchor", "middle")
    .attr("class", "chart-labels")
    .style("font-size", 12)
    .text("Date");

  d3.select("#view svg")
    .append("text")
    .attr("text-anchor", "middle")
    .attr("transform", "translate(10," + height / 2 + ")rotate(-90)")
    .style("font-size", 12)
    .attr("class", "chart-labels")
    .text("Total Per Million People");

  updateChart();
};

const filterDataByDate = () => {
  filterData();

  updatePoints(filteredData);
  languagesChart.updateChart(filteredData);
  loadGDP();
  updateSummary();
};

function updateChart() {
  mapWidth = document.querySelector(".map").offsetWidth;
  const margin = { top: 10, right: 32, bottom: 30, left: 64 },
    width = mapWidth - margin.left - margin.right,
    height = 200 - margin.top - margin.bottom;
  const lineSvg = d3.select("#timeline").select("g");

  let allData = d3.group(
    data.filter((d) => d.created_at !== null && d.created_at !== undefined),
    (d) => {
      const date = new Date(d.created_at);
      return new Date(date.getFullYear(), date.getMonth(), date.getDay());
    }
  );

  let groupedData = d3.group(
    filteredData.filter(
      (d) => d.created_at !== null && d.created_at !== undefined
    ),
    (d) => {
      const date = new Date(d.created_at);
      return new Date(date.getFullYear(), date.getMonth());
    }
  );

  const minDate = d3.min(allData, (d) => d[0]);
  const maxDate = d3.max(allData, (d) => d[0]);

  if (filterDateMin) {
    allDates = d3.timeMonths(
      filterDateMin,
      d3.timeDay.offset(filterDateMax, 1)
    );
  } else {
    allDates = d3.timeMonths(minDate, d3.timeDay.offset(maxDate, 1));
  }

  lineSvg.selectAll("g").remove();
  lineSvg.selectAll("path").remove();

  groupedData = allDates.map((date) => [date, groupedData.get(date) || []]);

  //   groupedData = Array.from(groupedData).sort((a, b) => a[0] - b[0]);

  const x = d3
    .scaleTime()
    .domain(
      d3.extent(groupedData, function (d) {
        return d[0];
      })
    )
    .range([0, width]);

  let xAxis = lineSvg
    .append("g")
    .attr("transform", `translate(0, ${height})`)
    .call(d3.axisBottom(x));

  // Add a clipPath: everything out of this area won't be drawn.
  var clip = lineSvg
    .append("defs")
    .append("svg:clipPath")
    .attr("id", "clip")
    .append("svg:rect")
    .attr("width", width)
    .attr("height", height)
    .attr("x", 0)
    .attr("y", 0);

  // Add brushing
  var brush = d3
    .brushX()
    .extent([
      [0, 0],
      [width, height],
    ])
    .on("end", resizeChart);

  var line = lineSvg.append("g").attr("clip-path", "url(#clip)");

  let y = null;
  let path = null;

  max = d3.max(groupedData, function (d) {
    return d[1].length;
  });

  y = d3.scaleLinear().domain([0, max]).range([height, 0]);
  lineSvg.append("g").call(d3.axisLeft(y));

  path = line.append("path");
  path
    .datum(groupedData)
    .attr("class", "line")
    .attr("fill", "#0083B7")
    .attr("fill-opacity", 0.6)
    .attr("stroke", "#0083B7")
    .attr("stroke-width", 2)
    .attr(
      "d",
      d3
        .area()
        .x(function (d) {
          return x(d[0]);
        })
        .y0(height)
        .y1(function (d) {
          return y(d[1].length);
        })
    );

  line.append("g").attr("class", "brush").call(brush);

  var idleTimeout;
  function idled() {
    idleTimeout = null;
  }

  function resizeChart(e) {
    extent = e.selection;

    console.log(e);
    if (!e.selection && e.mode == "handle") {
      filterDateMin = minDate;
      filterDateMax = maxDate;
      filterDataByDate();
      x.domain([minDate, maxDate]);
      updateChart();
    } else {
      if (e.mode == "handle") {
        console.log("NO RESET");
        filterDateMin = x.invert(e.selection[0]);
        filterDateMax = x.invert(e.selection[1]);
        filterDataByDate();
        x.domain([filterDateMin, filterDateMax]);
        line.select(".brush").call(brush.move, null);
      }
    }

    console.log(x.domain);

    // Update axis and line position
    xAxis.transition().duration(1000).call(d3.axisBottom(x));

    line
      .selectAll(".line")
      .transition()
      .duration(1000)
      .attr(
        "d",
        d3
          .area()
          .x(function (d) {
            return x(d[0]);
          })
          .y0(height)
          .y1(function (d) {
            return y(d[1].length);
          })
      );
  }
}

const filterData = () => {
  filteredData = data;
  if (filterDateMin) {
    filteredData = filteredData.filter(
      (item) =>
        new Date(item.created_at) >= filterDateMin &&
        new Date(item.created_at) <= filterDateMax
    );
  }

  if (selectedLanguage) {
    filteredData = filteredData.filter((item) =>
      item.languages.includes(selectedLanguage)
    );
  }

  if (selectedCountry) {
    groupedCountries = d3.group(filteredData, (d) => d.country_codes);
    filteredData = groupedCountries.get(selectedCountry);
  }
  networkLines.selectAll(".networkLine").remove();
};

const getPopulationData = async () => {
  population = await d3.csv("population.csv");
};

const reloadData = () => {
  d3.select("body").selectAll("svg").remove();
  loadMap(mapData);
  getPoints();
  languagesChart = new HorizontalBarChart("#languages", filteredData);
  loadGDP();
  loadChart();
};

// When window is resized, reload the current view
window.addEventListener("resize", (event) => {
  reloadData();
});

getMap().then((map) => {
  mapData = map;
  loadMap(mapData);
  getData().then(() => {
    getPopulationData().then(() => {
      getPoints();
      languagesChart = new HorizontalBarChart("#languages", filteredData);
      loadGDP();
      loadChart();
      updateData();
      updateLanguageFilters();
      updateCountryFilters();
    });
  });
});
