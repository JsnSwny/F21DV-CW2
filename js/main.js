// Gets map data from github URL
let data = [];
let filteredData = [];
let mapSvg = null;
let projection = null;
let plotColor = null;
let radiusScale = null;
let map;
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

// COLORS
// -------
const getData = async () => {
  data = await d3.json("data-16.json");
  filteredData = data;
};

const updateData = () => {
  //   getPopularLanguages();
  networkLines.selectAll(".networkLine").remove();
  filterData();
  updateChart();
  updatePoints(filteredData);
  languagesChart.updateChart(filteredData);
  loadGDP();
};

// -----------------------

// CHART TAB
// -----------------------

const loadChart = () => {
  // set the dimensions and margins of the graph

  d3.select("#timeline").selectAll("svg").remove();
  d3.select("#legend-container").selectAll("div").remove();
  const margin = { top: 10, right: 100, bottom: 70, left: 65 },
    width = 1400 - margin.left - margin.right,
    height = 200 - margin.top - margin.bottom;

  // append the svg object to the body of the page
  const lineSvg = d3
    .select("#timeline")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);
  const legend = d3.select("#legend-container");

  // X label
  d3.select("#view svg")
    .append("text")
    .attr("x", width / 2 + 100)
    .attr("y", height + 80)
    .attr("text-anchor", "middle")
    .attr("class", "chart-labels")
    .style("font-size", 12)
    .text("Date");

  // Y label
  d3.select("#view svg")
    .append("text")
    .attr("text-anchor", "middle")
    .attr("transform", "translate(10," + height / 2 + ")rotate(-90)")
    .style("font-size", 12)
    .attr("class", "chart-labels")
    .text("Total Per Million People");

  //   chartLines.domain().forEach((item, i) => {
  //     let legendItem = legend
  //       .append("div")
  //       .attr("class", "legend__item")
  //       .style("opacity", () => (chartDisplay.includes(item) ? 1 : 0.4))
  //       .style("cursor", "pointer")
  //       .on("click", () => {
  //         if (chartDisplay.includes(item)) {
  //           chartDisplay = chartDisplay.filter((chartItem) => chartItem != item);
  //         } else {
  //           chartDisplay.push(item);
  //         }
  //         loadChart();
  //       });
  //     legendItem
  //       .append("span")
  //       .attr("width", 8)
  //       .attr("height", 8)
  //       .attr("class", "legend__color")
  //       .style("background-color", chartLines(item));

  //     legendItem.append("span").text(item).attr("class", "legend__text");
  //   });

  updateChart();
};

const filterDataByDate = () => {
  filterData();

  updatePoints(filteredData);
  languagesChart.updateChart(filteredData);
  loadGDP();
  // updateContinent(continentSelect.value);
  // updateData();
};

function updateChart() {
  //   mapWidth = document.querySelector(".map").offsetWidth;
  //   mapHeight = document.querySelector(".view").offsetHeight;
  const margin = { top: 10, right: 100, bottom: 30, left: 50 },
    width = 1400 - margin.left - margin.right,
    height = 200 - margin.top - margin.bottom;
  const lineSvg = d3.select("#timeline").select("g");

  let allData = d3.group(
    data.filter((d) => d.created_at !== null && d.created_at !== undefined),
    (d) => {
      const date = new Date(d.created_at);
      // Create new Date object with only date portion
      return new Date(date.getFullYear(), date.getMonth(), date.getDay());
    }
  );

  // Group data by date, excluding data with null or undefined timestamps
  let groupedData = d3.group(
    filteredData.filter(
      (d) => d.created_at !== null && d.created_at !== undefined
    ),
    (d) => {
      const date = new Date(d.created_at);
      // Create new Date object with only date portion
      return new Date(date.getFullYear(), date.getMonth());
    }
  );

  const minDate = d3.min(allData, (d) => d[0]);
  const maxDate = d3.max(allData, (d) => d[0]);

  // Create a complete set of dates between the min and max dates
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

  // Fill in any missing dates with zero counts
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

  // Add the brushing
  line.append("g").attr("class", "brush").call(brush);

  // A function that set idleTimeOut to null
  var idleTimeout;
  function idled() {
    idleTimeout = null;
  }

  // Handles when chart is brushed/resized
  function resizeChart(e) {
    extent = e.selection; // Boundaries

    // If no selection, back to initial coordinate. Otherwise, update X axis domain
    if (!e.selection) {
      if (!idleTimeout) return (idleTimeout = setTimeout(idled, 350)); // This allows to wait a little bit
      x.domain([4, 8]);
    } else {
      filterDateMin = x.invert(e.selection[0]);
      filterDateMax = x.invert(e.selection[1]);
      filterDataByDate();
      x.domain([filterDateMin, filterDateMax]);
      line.select(".brush").call(brush.move, null); // Removes gray selection after brushing is complete
    }

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
};

const getPopulationData = async () => {
  population = await d3.csv("population.csv");
};

getMap().then((map) => {
  loadMap(map);
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
