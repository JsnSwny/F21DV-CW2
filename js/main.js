// Gets map data from github URL
let data = [];
let mapSvg = null;
let projection = null;
let plotColor = null;
let radiusScale = null;
let map;
let plots;
let points;
let selectedPoint;

// COLORS
// -------

let objects = [
  { unique_languages: ["Python", "JavaScript", "Java"] },
  { unique_languages: ["C++", "Java", "Python", "Ruby"] },
  { unique_languages: ["JavaScript", "Python", "PHP"] },
];

const getMap = async () => {
  const mapData = await d3.json(
    "https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson"
  );
  return mapData;
};

const getData = async () => {
  data = await d3.json("data-16.json");
};

const getPopularLanguages = () => {
  languagesRollup = d3.rollup(data, (v) => {
    return v
      .flatMap((d) => d.languages)
      .reduce((acc, lang) => {
        acc.set(lang, (acc.get(lang) || 0) + 1);
        return acc;
      }, new Map());
  });

  // set the dimensions and margins of the graph
  const margin = { top: 20, right: 30, bottom: 40, left: 60 },
    width = 460 - margin.left - margin.right,
    height = 400 - margin.top - margin.bottom;

  let languageCountsArray = Array.from(
    languagesRollup,
    ([language, count]) => ({
      language,
      count,
    })
  );

  let sortedLanguages = languageCountsArray
    .sort((a, b) => b.count - a.count)
    .slice(1, 21);

  let colorScale = d3
    .scaleOrdinal()
    .domain(sortedLanguages)
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

  // append the svg object to the body of the page
  const svg = d3
    .select("#languages")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

  const x = d3
    .scaleLinear()
    .domain([0, sortedLanguages[0].count])
    .range([0, width]);
  svg
    .append("g")
    .attr("transform", `translate(0, ${height})`)
    .call(d3.axisBottom(x))
    .selectAll("text")
    .attr("transform", "translate(-10,0)rotate(-45)")
    .style("text-anchor", "end");

  // Y axis
  const y = d3
    .scaleBand()
    .range([0, height])
    .domain(sortedLanguages.map((d) => d.language))
    .padding(0.1);
  svg.append("g").call(d3.axisLeft(y));

  //Bars
  svg
    .selectAll("myRect")
    .data(sortedLanguages)
    .join("rect")
    .attr("x", x(0))
    .attr("y", (d) => y(d.language))
    .attr("width", (d) => x(d.count))
    .attr("height", y.bandwidth())
    .attr("fill", (d, idx) => colorScale(idx));
};

const updateData = () => {
  getPopularLanguages();
  loadChart();
};

const hoverCountry = (obj) => {
  console.log(obj.id);
};

const selectPoint = (obj) => {
  console.log(obj.id);
};

const getPoints = async () => {
  points = await d3.json("points.json");
  points = points.sort(function (a, b) {
    return b.id.length - a.id.length;
  });
  points = points.map((item, index) => ({ ...item, pointId: index + 1 }));
  maxIdsLength = d3.max(points, (d) => d.id.length);
  plotColor = d3
    .scaleSqrt()
    .domain([1, maxIdsLength])
    .range(["#fff7ec", "#7f0000"]);

  radiusScale = d3.scaleSqrt().domain([1, maxIdsLength]).range([0.25, 10]);
  addPoints();
};

const zoom = d3
  .zoom()
  .on("zoom", (event) => {
    map.attr("transform", event.transform);
    plots.attr("transform", event.transform);
  })
  .scaleExtent([1, 10]);

const addPoints = () => {
  mapSvg.selectAll(".circle").remove();
  plots = mapSvg.append("g");
  plots
    .selectAll("g")
    .data(points)
    .enter("g")
    .append("g")
    .attr("class", "circle")
    .attr("transform", ({ longitude, latitude }) => {
      return `translate(${projection([longitude, latitude]).join(",")})`;
    })
    .append("circle")
    .attr("r", (d) => {
      let count = d.id.length;
      return radiusScale(count);
    })
    .attr("fill", (d) => {
      let count = d.id.length;
      return plotColor(count);
    })
    .attr("class", "point")
    .style("opacity", 0.75)
    .on("click", function (e, d) {
      if (
        selectedPoint &&
        selectedPoint.latitude == d.latitude &&
        selectedPoint.longitude == d.longitude
      ) {
        console.log("Already selected");
        selectedPoint = null;
        d3.selectAll(".point").style("opacity", 0.75);
      } else {
        d3.selectAll(".point").style("opacity", 0.1);
        d3.select(this).style("opacity", 1);
      }
      selectPoint(d);
    });
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
    .on("mouseover", (e, d) => hoverCountry(d));

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

const dateData = [
  { date: "2022-01-01", value: 10 },
  { date: "2022-01-02", value: 20 },
  { date: "2022-01-03", value: 30 },
  { date: "2022-01-02", value: 15 },
  { date: "2022-01-01", value: 25 },
];

function updateChart() {
  //   mapWidth = document.querySelector(".map").offsetWidth;
  //   mapHeight = document.querySelector(".view").offsetHeight;
  const margin = { top: 10, right: 100, bottom: 30, left: 50 },
    width = 1400 - margin.left - margin.right,
    height = 200 - margin.top - margin.bottom;
  const lineSvg = d3.select("#timeline").select("g");
  lineSvg.selectAll("g").remove();
  lineSvg.selectAll("path").remove();

  // Group data by date, excluding data with null or undefined timestamps
  let groupedData = d3.group(
    data.filter((d) => d.created_at !== null && d.created_at !== undefined),
    (d) => {
      const date = new Date(d.created_at);
      // Create new Date object with only date portion
      return new Date(date.getFullYear(), date.getMonth(), date.getDate());
    }
  );

  groupedData = Array.from(groupedData).sort((a, b) => a[0] - b[0]);

  //   console.log(sortedData);

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

  console.log(`Max ${max}`);

  y = d3.scaleLinear().domain([0, max]).range([height, 0]);
  lineSvg.append("g").call(d3.axisLeft(y));

  path = line.append("path");
  path
    .datum(groupedData)
    .attr("class", "line")
    .attr("fill", "none")
    .attr("stroke", "white")
    .attr("stroke-width", 1)
    .attr(
      "d",
      d3
        .line()
        .x(function (d) {
          return x(d[0]);
        })
        .y(function (d) {
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
          .line()
          .x(function (d) {
            return x(d[0]);
          })
          .y(function (d) {
            return y(d[1].length);
          })
      );
  }
}

getMap().then((map) => {
  loadMap(map);
  getData().then(() => {
    console.log(data);
    getPoints();
    updateData();
  });
});
