'use strict';

const key = 'pFfcXSfgYVfQMIMhlBxuDMZaFrbBSxDBfrF3SToyMYY'; 
const weatherBase = 'https://weather.ls.hereapi.com/weather/1.0/report.json';
const searchBase = 'https://browse.search.hereapi.com/v1/browse';
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

function createSearchQuery(categoryId) {
    const params = {
        apiKey: key,
        categories: categoryId,
        at: `${geoData.items[0].position.lat},${geoData.items[0].position.lng}`,
        limit: 10,
        lang: 'en-US'
    }
    const queryString = formatQueryParams(params);
    const searchUrl = searchBase + '?' + queryString;

    fetch(searchUrl)
    .then(response => {
        if (response.ok) {
            return response.json();
        }
        throw new Error(response.statusText);
    })
    .then(responseJson => {
        if (categoryId === '100-1000') {
            restData = responseJson;
            console.log(restData);
            makeRestList();
        }
        if (categoryId === '500') {
            hotelData = responseJson;
            console.log(hotelData);
            makeHotelList();
        }

    })
    .catch(error => {
        $('#js-error-message').text(`Something went wrong: ${error.message}`)
    });
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

function displayRestList(restListHTML) {
    console.log('displayRestList called')
    $('.js-rest-list').html(restListHTML).removeClass('hidden');
}

function displayHotelList(hotelListHTML) {
    console.log('displayHotelList called')
    $('.js-hotel-list').html(hotelListHTML).removeClass('hidden');
}

function makeRestList() {
    console.log('makeRestList called');
    let restListHTML = '<h3>Nearest Restaurants</h3><ol>'
    for (let i=0; i < restData.items.length; i++) {
        console.log(`cycle ${i+1}`);
        restListHTML += `<li>${restData.items[i].address.label}</li><br>`
    }
    restListHTML += '</ol>';
    console.log(restListHTML);
    displayRestList(restListHTML);
}

function makeHotelList() {
    console.log('makeHotelList called');
    let hotelListHTML = '<h3>Nearest Hotels</h3><ol>';
    for (let i=0; i < hotelData.items.length; i++) {
        hotelListHTML += `<li>${hotelData.items[i].address.label}</li><br>`
    }
    hotelListHTML += '</ol>';
    displayHotelList(hotelListHTML);
}

function getForecastIndex(forecastTime) {
    for (let i=0; i < hourlyData.hourlyForecasts.forecastLocation.forecast.length; i++) {
        if (hourlyData.hourlyForecasts.forecastLocation.forecast[i].localTime === forecastTime) {
            return i;
        }
    }
    return -1;
}

function parseLocalTime(utcTime) {
    const rawDate = utcTime.substring(0, utcTime.indexOf('T'));
    const dateArray = rawDate.split('-');
    return `${dateArray[1]}${dateArray[2]}${dateArray[0]}`;
}

function getForecast(hour, utcTime) {
    console.log('getForecast called')
    const forecastDate = parseLocalTime(utcTime);
    const forecastTime = `${hour}${forecastDate}`;
    const forecastIndex = getForecastIndex(forecastTime);
    if (forecastIndex === -1) {
        return 'No Forecast data available'
    }
    else {
        return [hourlyData.hourlyForecasts.forecastLocation.forecast[forecastIndex-1], hourlyData.hourlyForecasts.forecastLocation.forecast[forecastIndex], hourlyData.hourlyForecasts.forecastLocation.forecast[forecastIndex+1]];
    }
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

function parseDate(utcTime) {
    const months = {
        '01': 'January',
        '02': 'February',
        '03': 'March',
        '04': 'April',
        '05': 'May',
        '06': 'June',
        '07': 'July',
        '08': 'August',
        '09': 'September',
        '10': 'October',
        '11': 'November',
        '12': 'December'
    }
    const rawDate = utcTime.substring(0, utcTime.indexOf('T'));
    const dateArray = rawDate.split('-');
    return `${months[dateArray[1]]} ${dateArray[2]}, ${dateArray[0]}`
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

function createForecast(fcast) {
    console.log('createForecast called')
    if (fcast === 'No Forecast data available') {
        return `<li>${fcast}</li>`;
    }
    let forecastHTML = '';
    for (let i=0; i < fcast.length; i++) {
        const iconFilename = fcast[i].iconLink.substring(fcast[i].iconLink.lastIndexOf('/')+1);
        forecastHTML += `<li>${fcast[i].description} Temp: ${fcast[i].temperature}&deg;. Wind ${fcast[i].windDescShort} at ${fcast[i].windSpeed} mph. Chance of precipitation: ${fcast[i].precipitationProbability}% <img src="./images/weather-icons/${iconFilename}" alt="${fcast[i].iconName}"></li>`;
    }
    return forecastHTML;
}

function displayHours(hoursHTML) {
    $('.js-results').append(hoursHTML);
    $('.js-results, .js-button-container, #js-loc-refine').removeClass('hidden');
}

function makeGH(day = 0) {
    console.log('makeGH called');
    const sunrise = astronomyData.astronomy.astronomy[day].sunrise;
    const sunset = astronomyData.astronomy.astronomy[day].sunset;
    const utcTime = astronomyData.astronomy.astronomy[day].utcTime;
    //console.log(`sunrise is at ${sunrise}, sunset is at ${sunset}`);
    const sunriseHour = getHour(sunrise);
    const sunsetHour = getHour(sunset);
    const date = parseDate(utcTime);
    //const date = utcTime;
    //console.log(`sunrise hour is ${sunriseHour}, sunset hour is ${sunsetHour}`);
    const goldenHourAM = calcGH(sunrise);
    const goldenHourPM = calcGH(sunset);
    const blueHourAM = calcBH(sunrise);
    const blueHourPM = calcBH(sunset);
    const sunriseForecast = getForecast(sunriseHour, utcTime);
    const sunsetForecast = getForecast(sunsetHour, utcTime);
    //console.log(sunriseForecast);
    //console.log(sunsetForecast);
    const sunriseHTML = createForecast(sunriseForecast);
    const sunsetHTML = createForecast(sunsetForecast);
    //console.log(sunriseHTML);
    //console.log(sunsetHTML);
    const hoursHTML = `<h3>${date}</h3><ul><li>Morning<ul><li>Blue Hour ${blueHourAM} to ${sunrise}</li><li>Golden Hour ${sunrise} to ${goldenHourAM}</li><li>Forecast for Blue/Sunrise/Golden window<ul>${sunriseHTML}</ul></li></ul></li><li>Evening<ul><li>Golden Hour ${goldenHourPM} to ${sunset}</li><li>Blue Hour ${sunset} to ${blueHourPM}</li><li>Forecast for Golden/Sunset/Blue window<ul>${sunsetHTML}</ul></li></ul</li></ul>`;
    displayHours(hoursHTML);
}

function watchNewLoc() {
    $('.search-container').on('click', '#js-loc-submit', event => {
        console.log('watchNewLoc called');
        event.preventDefault();
        geoData = null;
        astronomyData = null;
        hourlyData = null;
        restData = null;
        hotelData = null;
        $('.js-results, .js-rest-list, .js-hotel-list').empty();
        const location = $('#js-location').val();
        createGeoWeatherQuery(location);
    });
}

function watch7Days() {
    $('.button-container').on('click', '#js-7day-button', event => {
        console.log('watch7Days called');
        event.preventDefault();
        for (let i=1; i < astronomyData.astronomy.astronomy.length; i++) {
            makeGH(i);
        }
    });
}

function watchRefineLoc() {
    console.log('watchRefineLoc called');
}

function watchRestaurants() {
    $('.js-button-container').on('click', '#js-rest-button', event => {
        console.log('watchRestaurants called');
        createSearchQuery('100-1000');
    });
}

function watchHotels() {
    $('.js-button-container').on('click', '#js-hotel-button', event => {
        console.log('watchHotels called');
        createSearchQuery('500');
    });
}

function handleApp() {
    watchNewLoc();
    watchRefineLoc();
    watchRestaurants();
    watchHotels();
    watch7Days();
}

$(handleApp);