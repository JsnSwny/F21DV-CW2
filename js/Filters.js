const updateLanguageFilters = () => {
  languages = data.flatMap((item) => item.languages);
  languagesSet = [...new Set(languages)].sort();
  select = d3.select("#languageSelect").on("change", function (e, d) {
    selectedLanguage = this.value;
    updateData();
  });
  select
    .selectAll("option")
    .data(languagesSet)
    .join("option")
    .text((d) => d);
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

  const uniqueCountries = Object.values(countries);

  select = d3.select("#countrySelect").on("change", function (e, d) {
    console.log(this.value);
    selectedCountry = this.value;
    updateData();
  });

  select
    .selectAll("option")
    .data(uniqueCountries)
    .join("option")
    .text((d) => d.country)
    .attr("value", (d) => d.country_code);
};
