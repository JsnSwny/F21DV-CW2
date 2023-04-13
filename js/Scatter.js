// -----------------------

// GDP VIEW
// -----------------------

const loadGDP = () => {
  d3.select("#scatter").selectAll("svg").remove();

  const margin = { top: 10, right: 100, bottom: 20, left: 40 },
    width = sidebarDom.offsetWidth - margin.left - margin.right,
    height = 400 - margin.top - margin.bottom;

  const svg = d3
    .select("#scatter")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

  dataWithCountry = filteredData.filter((item) => item.country_codes != null);
  groupedCountries = d3.group(dataWithCountry, (d) => d.country_codes);
  scatterData = [];
  groupedCountries.forEach((value, key) => {
    const numUsers = value.length;

    let countryPopulation = population.find(
      (obj) => obj["Country Code"] == key
    );

    if (countryPopulation) {
      scatterData.push({
        countryCode: key,
        numUsers: numUsers,
        users: value,
        population: parseInt(countryPopulation["2017"]),
      });
    }
  });

  const maxValues = {
    max_population: d3.max(scatterData, (d) => d.population),
    max_users: d3.max(scatterData, (d) => d.numUsers),
  };

  // Add X axis
  const x = d3
    .scaleLog()
    .domain([25000, maxValues.max_population])
    .range([0, width]);
  svg
    .append("g")
    .attr("transform", `translate(0, ${height})`)
    .call(d3.axisBottom(x));

  // Add Y axis
  const y = d3
    .scaleLinear()
    .domain([0, maxValues.max_users])
    .range([height, 0]);
  svg.append("g").call(d3.axisLeft(y));

  // X label
  d3.select("#view svg")
    .append("text")
    .attr("x", width / 2 + 100)
    .attr("y", height + 50)
    .attr("text-anchor", "middle")
    .attr("class", "chart-labels")
    .style("font-size", 12)
    .text("GDP Per Capita");

  // Y label
  d3.select("#view svg")
    .append("text")
    .attr("text-anchor", "middle")
    .attr("transform", "translate(20," + height / 2 + ")rotate(-90)")
    .style("font-size", 12)
    .attr("class", "chart-labels")
    .text("New Cases Per Million People");

  // // Add dots
  svg
    .append("g")
    .selectAll("dot")
    .data(scatterData)
    .join(
      function (enter) {
        g = enter
          .append("circle")
          .attr("cx", function (d) {
            return x(d.population);
          })
          .attr("cy", function (d) {
            return y(d.numUsers);
          })
          .attr("r", 3)
          .style("fill-opacity", 0.4)
          .style("fill", (d) => "#0083B7")
          .style("cursor", "pointer")
          .on("mousemove", (e, d) => {
            tooltipMouseMoveCountry(e, d);
          })

          .on("mouseover", (e, d) => {
            tooltipMouseOver();
          })
          .on("mouseout", (e, d) => {
            tooltipMouseOut();
          })
          .on("click", (e, d) => {
            selectCountry(d.countryCode);
            Tooltip.style("opacity", 0);
          });
        return g;
      },
      function (update) {
        let circle = update;
        circle
          .attr("cx", function (d) {
            return x(d.population);
          })
          .attr("cy", function (d) {
            return y(d.numUsers);
          });

        return;
      },
      function (exit) {
        return exit.remove();
      }
    );
};
