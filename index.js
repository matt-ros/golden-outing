'use strict';

const key = 'pFfcXSfgYVfQMIMhlBxuDMZaFrbBSxDBfrF3SToyMYY'; 
const weatherBase = 'https://weather.ls.hereapi.com/weather/1.0/report.json';
const searchBase = 'https://discover.search.hereapi.com/v1/discover';
const geoBase = 'https://geocode.search.hereapi.com/v1/geocode';
let geoData = null;
let astronomyData = null;
let hourlyData = null;
let searchData = null;

function formatQueryParams(params) {
    const queryItems = Object.keys(params)
      .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    return queryItems.join('&');
  }

  function createGeoQuery(loc) {
      const params = {
          apiKey: key,
          q: loc
      }
      const queryString = formatQueryParams(params);
      const geoUrl = geoBase + '?' + queryString;

      fetch(geoUrl)
      .then(response => {
          if (response.ok) {
              return response.json();
          }
          throw new Error(response.statusText);
      })
      .then(responseJson => {
          geoData = responseJson;
          console.log(geoData);
      })
      .catch(error => {
        $('#js-error-message').text(`Something went wrong: ${error.message}`)
      });
  }

function createWeatherQuery(type) {
    console.log(geoData);
    const params = {
        apiKey: key,
        latitude: geoData.items[0].position.lat,
        longitude: geoData.items[0].position.lng,
        product: `forecast_${type}`
    }
    const queryString = formatQueryParams(params);
    const weatherUrl = weatherBase + '?' + queryString;

    fetch(weatherUrl)
    .then(response => {
        if (response.ok) {
            return response.json();
        }
        throw new Error(response.statusText);
    })
    .then(responseJson => {
        if (type === 'astronomy') {
            astronomyData = responseJson;
            console.log(astronomyData);
        }
        if (type === 'hourly') {
            hourlyData = responseJson;
            console.log(hourlyData);
        }
    })
    .catch(error => {
        $('#js-error-message').text(`Something went wrong: ${error.message}`)
    });
}

function makeGH() {
    console.log('makeGH called');
}

function watchNewLoc() {
    $('.search-container').on('click', '#js-loc-submit', event => {
        console.log('watchNewLoc called');
        event.preventDefault();
        const location = $('#js-location').val();
        createGeoQuery(location);
        createWeatherQuery('astronomy');
        createWeatherQuery('hourly');
        makeGH();
    });
}

function watchRefineLoc() {
    console.log('watchRefineLoc called');
}

function watchPlaces() {
    console.log('watchPlaces called');
}

function watch7Days() {
    console.log('watch7Days called');
}

function handleApp() {
    watchNewLoc();
    watchRefineLoc();
    watchPlaces();
    watch7Days();
}

$(handleApp);