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

class HorizontalBarChart {
  constructor(svgElement, data) {
    this.margin = { top: 20, right: 30, bottom: 40, left: 90 };
    this.width = 460 - this.margin.left - this.margin.right;
    this.height = 400 - this.margin.top - this.margin.bottom;
    this.svg = d3
      .select(svgElement)
      .append("svg")
      .attr("width", this.width + this.margin.left + this.margin.right)
      .attr("height", this.height + this.margin.top + this.margin.bottom)
      .append("g")
      .attr("transform", `translate(${this.margin.left}, ${this.margin.top})`);
    this.data = data;
    this.languageCountsArray = [];
    this.sortedLanguages = [];
    this.colorScale = d3
      .scaleOrdinal()
      .range([
        "#e41a1c",
        "#377eb8",
        "#4daf4a",
        "#984ea3",
        "#ff7f00",
        "#ffff33",
        "#a65628",
        "#f781bf",
        "#999999",
      ]);
    this.x = d3.scaleLinear().range([0, this.width]);
    this.y = d3.scaleBand().range([0, this.height]).padding(0.1);
    this.xAxis = d3.axisBottom(this.x);
    this.yAxis = d3.axisLeft(this.y);

    this.createChart();
  }

  createChart() {
    const languagesRollup = d3.rollup(this.data, (v) => {
      return v
        .flatMap((d) => d.languages)
        .reduce((acc, lang) => {
          acc.set(lang, (acc.get(lang) || 0) + 1);
          return acc;
        }, new Map());
    });

    this.svg
      .attr("width", this.width + this.margin.left + this.margin.right)
      .attr("height", this.height + this.margin.top + this.margin.bottom)
      .append("g")
      .attr("transform", `translate(500, 100)`);

    this.languageCountsArray = Array.from(
      languagesRollup,
      ([language, count]) => ({
        language,
        count,
      })
    );

    this.sortedLanguages = this.languageCountsArray
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);

    this.colorScale.domain(this.sortedLanguages);

    this.x.domain([0, this.sortedLanguages[0].count]);
    this.y.domain(this.sortedLanguages.map((d) => d.language));

    this.svg.selectAll("*").remove();

    // X axis
    this.svg
      .append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0, ${this.height})`)
      .call(this.xAxis)
      .selectAll("text")
      .attr("transform", "translate(-10,0)rotate(-45)")
      .style("text-anchor", "end");

    // Y axis
    this.svg.append("g").attr("class", "y-axis").call(this.yAxis);

    // Bars
    this.svg
      .selectAll("myRect")
      .data(this.sortedLanguages)
      .join("rect")
      .attr("x", this.x(0))
      .attr("y", (d) => this.y(d.language))
      .attr("width", (d) => this.x(d.count))
      .attr("height", this.y.bandwidth())
      .attr("fill", (d, idx) => this.colorScale(idx));
  }
  updateChart(newData) {
    const languagesRollup = d3.rollup(newData, (v) => {
      return v
        .flatMap((d) => d.languages)
        .reduce((acc, lang) => {
          acc.set(lang, (acc.get(lang) || 0) + 1);
          return acc;
        }, new Map());
    });

    this.languageCountsArray = Array.from(
      languagesRollup,
      ([language, count]) => ({
        language,
        count,
      })
    );

    this.sortedLanguages = this.languageCountsArray
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);

    this.colorScale.domain(this.sortedLanguages);

    this.x.domain([0, this.sortedLanguages[0].count]);
    this.y.domain(this.sortedLanguages.map((d) => d.language));

    // Update X axis
    this.svg.select(".x-axis").call(this.xAxis);

    // Update Y axis
    this.svg.select(".y-axis").call(this.yAxis);

    // Update bars
    this.svg
      .selectAll("rect")
      .data(this.sortedLanguages)
      .join(
        (enter) =>
          enter

            .append("rect")
            .on("click", function (e, d) {
              console.log(d);
            })
            .style("cursor", "pointer")
            .transition()
            .duration(1000)
            .attr("x", this.x(0))
            .attr("y", (d) => this.y(d.language))

            .attr("width", (d) => this.x(d.count))
            .attr("height", this.y.bandwidth())
            .attr("fill", (d, idx) => this.colorScale(idx)),

        (update) =>
          update
            .on("click", function (e, d) {
              filterByLanguage(d.language);
            })

            .transition()
            .duration(1000)
            .attr("x", this.x(0))
            .attr("y", (d) => this.y(d.language))
            .style("cursor", "pointer")

            .attr("width", (d) => this.x(d.count))
            .attr("height", this.y.bandwidth())
            .attr("fill", (d, idx) => this.colorScale(idx)),
        (exit) => exit.remove()
      );
  }
}

const filterByLanguage = (language) => {
  filteredData = data.filter((item) => item.languages.includes(language));
  updateData();
};

// COLORS
// -------
const getMap = async () => {
  const mapData = await d3.json(
    "https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson"
  );
  return mapData;
};

const getData = async () => {
  data = await d3.json("data-16.json");
  filteredData = data;
};

const updateData = () => {
  //   getPopularLanguages();
  loadChart();
  updatePoints(filteredData);
  languagesChart.updateChart(filteredData);
};

const hoverCountry = (obj) => {
  groupedCountries = d3.group(data, (d) => d.country_codes);
  filteredData = groupedCountries.get(obj.id);
  updateData();
};

const selectPoint = (obj) => {
  following = obj[1].map((item) => item.following_list);
  const uniqueFollowing = [...new Set(following.flat())];

  const followingData = data.filter((item) =>
    uniqueFollowing.includes(item.id)
  );

  console.log(followingData);
  // data = data.filter((d) => d.locations !== null);
  // let points = d3.group(data, (d) => `${d.latitude},${d.longitude}`);
};

const getPoints = async () => {
  updatePoints(data);
};

const updatePoints = (data) => {
  data = data.filter((d) => d.locations !== null);
  let points = d3.group(data, (d) => `${d.latitude},${d.longitude}`);

  const maxIdsLength = d3.max(points, (group) => group[1].length);

  plotColor = d3
    .scaleSqrt()
    .domain([1, maxIdsLength])
    .range(["#fff7ec", "#7f0000"]);

  radiusScale = d3.scaleSqrt().domain([1, maxIdsLength]).range([0.25, 10]);
  addPoints(points);
  return points;
};

const zoom = d3
  .zoom()
  .on("zoom", (event) => {
    map.attr("transform", event.transform);
    plots.attr("transform", event.transform);
    // plots.selectAll("g").attr("transform", (d) => {
    //   const zoomTransform = d3.zoomTransform(mapSvg.node());
    //   const [latitude, longitude] = d[0].split(",");
    //   const [x, y] = projection([longitude, latitude]);
    //   return `translate(${zoomTransform.apply([x, y]).join(",")})`;
    // });
  })
  .scaleExtent([1, 10]);

const addPoints = (data) => {
  mapSvg.selectAll(".circle").remove();
  console.log(data);
  plots = mapSvg.append("g");
  plots
    .selectAll("g")
    .data(data)
    .enter("g")
    .append("g")
    .attr("class", "circle")
    .attr("transform", (d) => {
      const [latitude, longitude] = d[0].split(",");
      return `translate(${projection([longitude, latitude]).join(",")})`;
    })
    .append("circle")
    .attr("r", (d) => {
      let count = d[1].length;
      return radiusScale(count);
    })
    .attr("fill", (d) => {
      let count = d[1].length;
      return plotColor(count);
    })
    .attr("class", "point")
    .style("opacity", 0.75)
    .style("cursor", "pointer")
    .on("click", function (e, d) {
      if (selectedPoint && selectedPoint.latitude == d.latitude) {
        selectedPoint = null;
        d3.selectAll(".point")
          .transition()
          .duration(400)
          .style("opacity", 0.75);
      } else {
        d3.selectAll(".point").transition().duration(400).style("opacity", 0.1);
        d3.select(this).transition().duration(400).style("opacity", 1);
        selectedPoint = d;
      }
      selectPoint(d);
    });
  const zoomTransform = d3.zoomTransform(mapSvg.node());
  plots.attr("transform", zoomTransform);
  mapSvg.call(zoom);
};

const loadMap = (mapData) => {
  mapSvg = d3.select("#map").append("svg").attr("id", "map");
  let width = document.querySelector("#map").offsetWidth;
  let height = document.querySelector("#map").offsetHeight;
  mapSvg.attr("width", width);
  mapSvg.attr("height", height);

  // Create the map group
  map = mapSvg.append("g");

  projection = d3
    .geoNaturalEarth1()
    .scale(500)
    .center([-3.188267, 55.953251])
    .translate([width / 2, height / 2]);
  features = map
    .selectAll("path")
    .data(mapData.features.filter((d) => d.id !== "GRL" && d.id !== "ATA"))
    .join("path");

  features
    .attr("class", "country")
    .attr("d", d3.geoPath().projection(projection))
    .style("stroke", "#262632")
    .attr("fill", "#33333E")
    .style("cursor", "pointer")
    .on("mouseover", function (e, d) {
      // d3.selectAll(".country")
      //   .transition()
      //   .duration(400)
      //   .attr("fill", "#33333E");
      // d3.select(this).transition().duration(400).attr("fill", "#0083B7");
      // hoverCountry(d);
    })
    .on("mouseout", function (e, d) {
      // d3.selectAll(".country")
      //   .transition()
      //   .duration(400)
      //   .attr("fill", "#33333E");
      // filteredData = data;
      // updateData();
    })
    .on("click", function (e, d) {
      d3.selectAll(".country")
        .transition()
        .duration(400)
        .attr("fill", "#33333E");

      d3.select(this).transition().duration(400).attr("fill", "#636386");
    });

  mapSvg.call(zoom);
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

  console.log(filteredData);

  const minDate = d3.min(allData, (d) => d[0]);
  const maxDate = d3.max(allData, (d) => d[0]);

  // Create a complete set of dates between the min and max dates
  const allDates = d3.timeMonths(minDate, d3.timeDay.offset(maxDate, 1));
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
      //   filterDataByDate(filteredData);
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

getMap().then((map) => {
  loadMap(map);
  getData().then(() => {
    getPoints();
    languagesChart = new HorizontalBarChart("#languages", filteredData);
    updateData();
  });
});
