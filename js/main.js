// Gets map data from github URL
let data = [];
let mapSvg = null;
let projection = null;
let plotColor = null;
let radiusScale = null;
let map;
let plots;

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
};

const getPoints = async () => {
  data = await d3.json("points.json");
  data = data.sort(function (a, b) {
    return a.id.length - b.id.length;
  });
  console.log(data);
  maxIdsLength = d3.max(data, (d) => d.id.length);
  plotColor = d3
    .scaleSqrt()
    .domain([1, maxIdsLength])
    .range(["#fff7ec", "#7f0000"]);

  radiusScale = d3.scaleSqrt().domain([1, maxIdsLength]).range([0.25, 4]);
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
  console.log(data.length);
  mapSvg.selectAll(".circle").remove();
  plots = mapSvg.append("g");
  plots
    .selectAll("g")
    .data(data)
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
    .style("opacity", 0.75);
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
    .attr("fill", "#33333E");

  mapSvg.call(zoom);
};

getMap().then((map) => {
  loadMap(map);
  getData().then(() => {
    console.log(data);
    getPoints();
    updateData();
  });
});
