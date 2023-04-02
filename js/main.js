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

const getMap = async () => {
	const mapData = await d3.json(
		"https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson"
	);
	return mapData;
};

const getData = async () => {
	data = await d3.json("data.json");
	data = data.slice(0, 10000);
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

	points.call(zoom);
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
		getPoints();
	});
});
