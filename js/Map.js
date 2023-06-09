const getMap = async () => {
  const mapData = await d3.json(
    "https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson"
  );
  return mapData;
};

const selectPoint = (obj) => {
  following = obj[1].flatMap((item) => item.following_list);

  let followingData = filteredData.filter((item) =>
    following.includes(item.id)
  );

  followingData = followingData.filter((d) => d.locations !== null);

  const groupLatLongs = followingData.map((item) => [
    item.latitude,
    item.longitude,
    item.locations,
  ]);

  const lineGenerator = d3
    .line()
    .x((d) => projection([d[1], d[0]])[0])
    .y((d) => projection([d[1], d[0]])[1]);

  const [latitude, longitude] = obj[0].split(",");

  networkLines.selectAll(".networkLine").remove();

  networkLines
    .selectAll(".networkLine")
    .data(groupLatLongs)
    .enter()

    .append("path")

    .attr("class", "networkLine")

    .attr("d", (d) => lineGenerator([d, [latitude, longitude]]))
    .style("stroke", "#0083B7")
    .style("stroke-opacity", 0.2)
    .style("stroke-width", 0.5)
    .style("fill", "none")
    .attr("stroke-dasharray", function () {
      return this.getTotalLength();
    })
    .attr("stroke-dashoffset", function () {
      return this.getTotalLength();
    })
    .on("mousemove", (e, d) => {
      locations_from = obj[1][0].locations.split(", ");
      locations_to = d[2].split(", ");
      connections = followingData.filter(
        (item) => item.latitude == d[0] && item.longitude == d[1]
      );
      tooltipMouseMoveNetwork(e, locations_from, locations_to, connections);
    })
    .on("mouseover", function (e, d) {
      tooltipMouseOver();
    })
    .on("mouseout", function (e, d) {
      tooltipMouseOut();
    })
    .transition()
    .duration(2000)
    .ease(d3.easeLinear)
    .attr("stroke-dashoffset", 0);
};

const getPoints = async () => {
  updatePoints(data);
};

const updatePoints = (data) => {
  data = data.filter((d) => d.locations !== null);
  points = d3.group(data, (d) => `${d.latitude},${d.longitude}`);

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
    networkLines.attr("transform", event.transform);
  })
  .scaleExtent([0.8, 50]);

const addPoints = (data) => {
  mapSvg.selectAll(".circle").remove();
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
      if (selectedPoint && selectedPoint[0] == d[0]) {
        selectedPoint = null;
        d3.selectAll(".point")
          .transition()
          .duration(400)
          .style("opacity", 0.75);
        networkLines.selectAll(".networkLine").remove();
      } else {
        d3.selectAll(".point").transition().duration(400).style("opacity", 0.1);
        d3.select(this).transition().duration(400).style("opacity", 1);
        selectedPoint = d;
        selectPoint(d);
      }
    })
    .on("mouseover", function (e, d) {
      tooltipMouseOver();
    })
    .on("mouseout", function (e, d) {
      tooltipMouseOut();
    })
    .on("mousemove", (e, d) => tooltipMouseMove(e, d));
  const zoomTransform = d3.zoomTransform(mapSvg.node());
  plots.attr("transform", zoomTransform);
  mapSvg.call(zoom);
};

const loadMap = (mapData) => {
  mapSvg = d3
    .select("#map")
    .append("svg")
    .attr("id", "map")
    .on("click", function (e) {
      if (e.target == this) {
        selectCountry("");
      }
    });

  let width = document.querySelector("#map").offsetWidth;
  let height = document.querySelector("#map").offsetHeight;
  mapSvg.attr("width", width);
  mapSvg.attr("height", height);

  // Create the map group
  map = mapSvg.append("g");

  projection = d3
    .geoNaturalEarth1()
    .scale(400)
    .center([-3.188267, 20.953251])
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
    .on("mousemove", (e, d) => {
      let country = scatterData.find((item) => item.countryCode == d.id);
      tooltipMouseMoveCountry(e, country);
    })

    .on("mouseover", (e, d) => {
      tooltipMouseOver();
    })
    .on("mouseout", (e, d) => {
      tooltipMouseOut();
    })
    .on("click", function (e, d) {
      selectCountry(d.id);
    });

  mapSvg.call(zoom);
  networkLines = mapSvg.append("g").attr("class", "network");
};
