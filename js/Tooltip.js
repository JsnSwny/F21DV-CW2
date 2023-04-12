// -----------------------

// TOOLTIP
// -----------------------

const Tooltip = d3
  .select("body")
  .append("div")
  .attr("class", "tooltip")
  .style("opacity", 0)
  .style("background-color", "white")
  .style("border", "solid")
  .style("border-width", "2px")
  .style("border-radius", "5px")
  .style("padding", "5px")
  .style("position", "absolute")
  .style("pointer-events", "none");

const tooltipMouseOver = function () {
  Tooltip.style("opacity", 1);
};

var tooltipMouseMove = function (event, d) {
  locations = d[1][0].locations.split(", ");
  [latitude, longitude] = d[0].split(",");
  following = d[1].flatMap((item) => item.following_list);
  followers = d[1].flatMap((item) => item.followers_list);

  //   following = filteredData.filter((item) => following.includes(item.id));
  //   followers = filteredData.filter((item) => followers.includes(item.id));

  Tooltip.html(
    `<h4 class="tooltip__title">${latitude}, ${longitude}</h4>
    <br>
    Users: ${d[1].length.toLocaleString()}
    <br>
    Location: ${locations[0]}${
      locations.length > 1 ? ", " + locations[locations.length - 1] : ""
    }
    <br>
    Following: ${following.length.toLocaleString()}
    `
  )
    .style("left", d3.pointer(event, this)[0] + "px")
    .style("top", d3.pointer(event, this)[1] - 100 + "px");
};

var tooltipMouseMoveCountry = function (event, d) {
  Tooltip.html(
    `<h4 class="tooltip__title">${d.users[0].country}</h4>
    <br>
    Users: ${d.numUsers.toLocaleString()}
    <br>
    Population: ${d.population.toLocaleString()}
    `
  )
    .style("left", d3.pointer(event, this)[0] + "px")
    .style("top", d3.pointer(event, this)[1] - 100 + "px");
};

var tooltipMouseMoveLanguage = function (event, d) {
  console.log(d);
  Tooltip.html(
    `<h4 class="tooltip__title">${d.language}</h4>
    <br>
    Users: ${d.count.toLocaleString()}
    `
  )
    .style("left", d3.pointer(event, this)[0] + "px")
    .style("top", d3.pointer(event, this)[1] - 100 + "px");
};

var tooltipMouseOut = function () {
  Tooltip.style("opacity", 0);
};
