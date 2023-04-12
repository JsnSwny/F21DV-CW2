class HorizontalBarChart {
  constructor(svgElement, data) {
    this.margin = { top: 20, right: 64, bottom: 40, left: 100 };
    this.width = sidebarDom.offsetWidth - this.margin.left - this.margin.right;
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
      .attr("fill", (d, idx) => languageColors[d.language]);
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

    console.log("Updating chart");
    console.log(this.sortedLanguages);

    // Update bars
    this.svg
      .selectAll("rect")
      .data(this.sortedLanguages)
      .join(
        (enter) =>
          enter
            .append("rect")
            .style("cursor", "pointer")
            .transition()
            .duration(1000)
            .attr("x", this.x(0))
            .attr("y", (d) => this.y(d.language))

            .attr("width", (d) => this.x(d.count))
            .attr("height", this.y.bandwidth())
            .attr("fill", (d, idx) => languageColors[d.language]),

        (update) =>
          update
            .on("click", function (e, d) {
              if (selectedLanguage == d.language) {
                selectLanguage("");
              } else {
                selectLanguage(d.language);
              }
            })
            .on("mouseover", (e) => {
              d3.select(e.target)
                .transition()
                .duration(300)
                .style("opacity", 1);
            })

            .on("mouseout", (e) => {
              d3.select(e.target)
                .transition()
                .duration(300)
                .style("opacity", (d) =>
                  !selectedLanguage
                    ? 1
                    : d.language != selectedLanguage
                    ? 0.2
                    : 1
                );
            })
            .transition()
            .duration(1000)
            .attr("x", this.x(0))
            .attr("y", (d) => this.y(d.language))
            .style("cursor", "pointer")

            .attr("width", (d) => this.x(d.count))
            .attr("height", this.y.bandwidth())
            .attr("fill", (d, idx) => {
              return languageColors[d.language]
                ? languageColors[d.language]
                : this.colorScale(idx);
            })
            .style("opacity", (d) => {
              console.log(selectedLanguage);
              return !selectedLanguage
                ? 1
                : d.language == selectedLanguage
                ? 1
                : 0.2;
            }),
        (exit) => exit.remove()
      );
  }
}
