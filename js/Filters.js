const updateSummary = () => {
  d3.select("#data-summary").select("#data-summary__content").remove();
  content = d3
    .select("#data-summary")
    .append("div")
    .attr("id", "data-summary__content");

  content
    .append("p")
    .append("b")
    .text(`Total Users: `)
    .append("span")
    .text(`${filteredData.length.toLocaleString()}`);

  content
    .append("p")
    .append("b")
    .text(`Unique Points: `)
    .append("span")
    .text(`${points.size.toLocaleString()}`);
};

const selectCountry = (country) => {
  selectedOption = d3
    .select("#countrySelect")
    .select(`option[value='${country}']`);
  selectedOption.property("selected", true);
  selectedCountry = country;
  updateData();
};

const selectLanguage = (language) => {
  selectedOption = d3
    .select("#languageSelect")
    .select(`option[value='${language}']`);
  selectedOption.property("selected", true);
  selectedLanguage = language;
  updateData();
};

const updateLanguageFilters = () => {
  languages = data.flatMap((item) => item.languages);
  languagesSet = [...new Set(languages)].sort();
  select = d3.select("#languageSelect").on("change", function (e, d) {
    selectLanguage(this.value);
  });

  select

    .selectAll("option")
    .data(languagesSet)
    .enter()
    .append("option")
    .text((d) => d)
    .attr("value", (d) => d);
};

const updateCountryFilters = () => {
  filteredCountryData = data.filter((item) => item.country_codes != null);
  countries = filteredCountryData.reduce((acc, user) => {
    if (!acc[user.country_codes]) {
      acc[user.country_codes] = {
        country: user.country,
        country_code: user.country_codes,
      };
    }
    return acc;
  }, {});

  let uniqueCountries = Object.values(countries);

  uniqueCountries = uniqueCountries.sort((a, b) => {
    if (a.country < b.country) {
      return -1;
    }
    if (a.country > b.country) {
      return 1;
    }
    return 0;
  });

  select = d3.select("#countrySelect").on("change", function (e, d) {
    selectCountry(this.value);
  });

  select
    .selectAll("option")
    .data(uniqueCountries)
    .enter()
    .append("option")
    .text((d) => d.country)
    .attr("value", (d) => d.country_code);
};
