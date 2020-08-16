'use strict';

const key = 'pFfcXSfgYVfQMIMhlBxuDMZaFrbBSxDBfrF3SToyMYY'; 
const weatherBase = 'https://weather.ls.hereapi.com/weather/1.0/report.json';
const searchBase = 'https://discover.search.hereapi.com/v1/discover';
const geoBase = 'https://geocode.search.hereapi.com/v1/geocode';
let geoData = null;
let astronomyData = null;
let hourlyData = null;
let searchData = null;
let restData = null;
let hotelData = null;

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
            //console.log(geoData);
        })
        .catch(error => {
            $('#js-error-message').text(`Something went wrong: ${error.message}`)
        });
}

function createGeoWeatherQuery(loc) {
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
            //console.log(geoData);
            createWeatherQuery('astronomy');
            createWeatherQuery('hourly');
        })
        .catch(error => {
            $('#js-error-message').text(`Something went wrong: ${error.message}`)
        });
}

function createWeatherQuery(type) {
    const params = {
        apiKey: key,
        latitude: geoData.items[0].position.lat,
        longitude: geoData.items[0].position.lng,
        product: `forecast_${type}`,
        metric: false
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
            //console.log(astronomyData);
        }
        if (type === 'hourly') {
            hourlyData = responseJson;
            //console.log(hourlyData);
        }
        if (astronomyData !== null && hourlyData !== null) {
            makeGH();
        }
    })
    .catch(error => {
        $('#js-error-message').text(`Something went wrong: ${error.message}`)
    });
}

function getHour(time) {
    let hour = time.substring(0, time.indexOf(':'));
    if (time.charAt(time.length - 2) === 'A') {
        if (hour.length === 1) {
            hour = `0${hour}`;
        }
        if (hour === '12') {
            hour = '00';
        }
        return hour;
    }
    if (time.charAt(time.length - 2) === 'P') {
        hour = parseInt(hour) + 12;
        if (hour === 24) {
            hour = 12;
        }
        return String(hour);
    }
}

function calcGH(time) {
    const am = (time.charAt(time.length - 2) === 'A');
    let aOrP = time.charAt(time.length - 2)
    let hour = parseInt(time.substring(0, time.indexOf(':')));
    const min = time.substring(time.indexOf(':'), time.indexOf(aOrP));
    if (am === true) {
        hour++;
        if (hour === 13) {
            hour = 1;
        }
        if (hour === 12) {
            aOrP = 'P';
        }
    }
    else {
        hour--;
        if (hour === 0) {
            hour = 12;
        }
        if (hour === 11) {
            aOrP = 'A'
        }
    }
    return `${hour}${min}${aOrP}M`;
}

function calcBH(time) {
    const am = (time.charAt(time.length - 2) === 'A');
    let aOrP = time.charAt(time.length - 2)
    let hour = parseInt(time.substring(0, time.indexOf(':')));
    const min = time.substring(time.indexOf(':'), time.indexOf(aOrP));
    if (am === true) {
        hour--;
        if (hour === 0) {
            hour = 12;
        }
        if (hour === 11) {
            aOrP = 'A'
        }
    }
    else {
        hour++;
        if (hour === 13) {
            hour = 1;
        }
        if (hour === 12) {
            aOrP = 'P';
        }
    }
    return `${hour}${min}${aOrP}M`;
}

function displayHours(hoursHTML) {
    $('.js-results').prepend(hoursHTML);
    $('.js-results, #js-loc-refine').removeClass('hidden');
}

function makeGH(day = 0) {
    //console.log('makeGH called');
    const sunrise = astronomyData.astronomy.astronomy[day].sunrise;
    const sunset = astronomyData.astronomy.astronomy[day].sunset;
    //console.log(`sunrise is at ${sunrise}, sunset is at ${sunset}`);
    const sunriseHour = getHour(sunrise);
    const sunsetHour = getHour(sunset);
    //console.log(`sunrise hour is ${sunriseHour}, sunset hour is ${sunsetHour}`);
    const goldenHourAM = calcGH(sunrise);
    const goldenHourPM = calcGH(sunset);
    const blueHourAM = calcBH(sunrise);
    const blueHourPM = calcBH(sunset);
    const hoursHTML = `<p>Blue Hour is from ${blueHourAM} to ${sunrise} and from ${sunset} to ${blueHourPM}.</p><p>Golden Hour is from ${sunrise} to ${goldenHourAM} and from ${goldenHourPM} to ${sunset}.</p>`;
    displayHours(hoursHTML);
}

function watchNewLoc() {
    $('.search-container').on('click', '#js-loc-submit', event => {
        console.log('watchNewLoc called');
        event.preventDefault();
        const location = $('#js-location').val();
        createGeoWeatherQuery(location);
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