'use strict';

const key = 'pFfcXSfgYVfQMIMhlBxuDMZaFrbBSxDBfrF3SToyMYY';
const gKey = 'AIzaSyC_oOddO8wOobo7U9amQ5RJlm6z9UDwIE0'; 
const weatherBase = 'https://weather.ls.hereapi.com/weather/1.0/report.json';
const searchBase = 'https://browse.search.hereapi.com/v1/browse';
const geoBase = 'https://geocode.search.hereapi.com/v1/geocode';
const mapBase = 'https://www.google.com/maps/embed/v1/place';
let geoData = null;
let astronomyData = null;
let hourlyData = null;
let currentConditionsData = null;
let restData = null;
let hotelData = null;

function formatQueryParams(params) {
    const queryItems = Object.keys(params)
      .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    return queryItems.join('&');
}

function createWeatherGeoQuery(loc) {
    const params = {
        apiKey: key,
        name: loc,
        metric: false,
        product: 'forecast_astronomy'
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
            astronomyData = responseJson;
            const coord = `${astronomyData.astronomy.latitude},${astronomyData.astronomy.longitude}`;
            createGeoFromWeather(loc, coord);
        })
        .catch(error => {
            $('#js-error-message').text(`Something went wrong: ${error.message}`).show('slow')
        });
}

function createGeoFromWeather(loc, coord) {
    const params = {
        apiKey: key,
        q: loc,
        at: coord,
        lang: 'en-US'
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
            createWeatherQuery('hourly');
            createWeatherQuery('observation');
        })
        .catch(error => {
            $('#js-error-message').text(`Something went wrong: ${error.message}`).show('slow')
        });
}

function createSearchQuery(category) {
    const params = {
        apiKey: key,
        at: `${geoData.items[0].position.lat},${geoData.items[0].position.lng}`,
        limit: 10,
        lang: 'en-US'
    }
    if (category === 'restaurant') {
        params.categories = '100-1000'
    }
    if (category === 'hotel') {
        params.categories = '500-5000,500-5100-0057,500-5100-0058'
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
        if (category === 'restaurant') {
            restData = responseJson;
            console.log(restData);
            makeRestList();
        }
        if (category === 'hotel') {
            hotelData = responseJson;
            console.log(hotelData);
            makeHotelList();
        }

    })
    .catch(error => {
        $('#js-error-message').text(`Something went wrong: ${error.message}`).show('slow')
    });
}

function createGeoQuery(loc) {
    const params = {
        apiKey: key,
        q: loc,
        lang: 'en-US'
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
            $('#js-error-message').text(`Something went wrong: ${error.message}`).show('slow')
        });
}

function createGeoWeatherQuery(loc) {
    const params = {
        apiKey: key,
        q: loc,
        lang: 'en-US'
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
            createWeatherQuery('observation');
        })
        .catch(error => {
            $('#js-error-message').text(`Something went wrong: ${error.message}`).show('slow')
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
    if (type === 'observation') {
        params.product = `${type}`;
        params.oneobservation = true;
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
        if (type === 'observation') {
            currentConditionsData = responseJson;
        }
        if (astronomyData !== null && hourlyData !== null && currentConditionsData !== null) {
            makeGH();
        }
    })
    .catch(error => {
        $('#js-error-message').text(`Something went wrong: ${error.message}`).show('slow')
    });
}

function makeMap() {
    const params = {
        key: gKey,
        q: geoData.items[0].address.label
    }
    if (geoData.items[0].resultType === 'locality') {
        params.q = `${geoData.items[0].position.lat},${geoData.items[0].position.lng}`;
    }
    const queryString = formatQueryParams(params);
    const mapUrl = mapBase + '?' + queryString;
    return `<iframe width="800" height="450" frameborder="0" style="border:0" src="${mapUrl}" allowfullscreen></iframe>`;
}

function displayRestList(restListHTML) {
    console.log('displayRestList called')
    $('.js-rest-list').html(restListHTML).toggle('slow');
    $('#rest-list').get(0).scrollIntoView({behavior: 'smooth'});
}

function displayHotelList(hotelListHTML) {
    console.log('displayHotelList called')
    $('.js-hotel-list').html(hotelListHTML).toggle('slow');
    $('#hotel-list').get(0).scrollIntoView({behavior: 'smooth'});
}

function makeRestList() {
    console.log('makeRestList called');
    let restListHTML = '<h3>Nearest Restaurants</h3>'
    if (restData.items.length === 0) {
        restListHTML += '<p>No restaurants found</p>';
    }
    else {
        restListHTML += '<ol>'
        for (let i=0; i < restData.items.length; i++) {
            //console.log(`cycle ${i+1}`);
            restListHTML += `<li><a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(restData.items[i].address.label)}" target="_blank">${restData.items[i].address.label}</a></li><br>`
        }
        restListHTML += '</ol>';
    }
    //console.log(restListHTML);
    displayRestList(restListHTML);
}

function makeHotelList() {
    console.log('makeHotelList called');
    let hotelListHTML = '<h3>Nearest Hotels</h3>';
    if (hotelData.items.length === 0) {
        hotelListHTML += '<p>No hotels found</p>';
    }
    else {
        hotelListHTML += '<ol>'
        for (let i=0; i < hotelData.items.length; i++) {
            hotelListHTML += `<li><a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(hotelData.items[i].address.label)}" target="_blank">${hotelData.items[i].address.label}</a></li><br>`
        }
        hotelListHTML += '</ol>';
    }
    displayHotelList(hotelListHTML);
}

function makeCurrentConditions() {
    const observation = currentConditionsData.observations.location[0].observation[0];
    const iconFilename = observation.iconLink.substring(observation.iconLink.lastIndexOf('/')+1);
    return `<p>${observation.description} Temp: ${parseInt(observation.temperature, 10)}&deg;F. Wind ${observation.windDescShort} at ${parseInt(observation.windSpeed, 10)} mph.<br><img src="./images/weather-icons/${iconFilename}" alt="${observation.iconName}">`;
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
        return `<td colspan="3">${fcast}</td>`;
    }
    let forecastHTML = '';
    for (let i=0; i < fcast.length; i++) {
        if (fcast[i] === undefined) {
            forecastHTML += '<td>No data available</td>';
            continue;
        }
        const iconFilename = fcast[i].iconLink.substring(fcast[i].iconLink.lastIndexOf('/')+1);
        forecastHTML += `<td class="fcast">${fcast[i].description} Temp: ${parseInt(fcast[i].temperature, 10)}&deg;F. Wind ${fcast[i].windDescShort} at ${parseInt(fcast[i].windSpeed, 10)} mph. Chance of precipitation: ${fcast[i].precipitationProbability}%<br><img src="./images/weather-icons/${iconFilename}" alt="${fcast[i].iconName}"></td>`;
    }
    return forecastHTML;
}

function displayHours(hoursHTML) {
    if ($('.js-results').text().length === 0) {
        $('.js-results-loc').html(`<h2>Displaying results for ${geoData.items[0].address.label}</h2>${makeMap()}<h3>Current Conditions</h3>${makeCurrentConditions()}`).show('slow');
    }
    $('.js-results').append(hoursHTML);
    $('.js-results, .js-button-container, #js-loc-refine').show('slow').removeClass('hidden');
    $('.js-button-container').css('display', 'flex');
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
    const hoursHTML = `<div class="day">
        <h3 class="result-item" id="day-${day}">${date}</h3>
        <div class="result-item">
            <table>
                <tr>
                    <th colspan="3">Morning</th>
                </tr>
                <tr>
                    <th>Blue Hour</th>
                    <th>Sunrise</th>
                    <th> Golden Hour</th>
                </tr>
                <tr>
                    <td>${blueHourAM} to ${sunrise}</td>
                    <td>${sunrise}</td>
                    <td>${sunrise} to ${goldenHourAM}</td>
                </tr>
                <tr>
                    ${sunriseHTML}
                </tr>
            </table>
        </div>
        <div class="result-item">
            <table>
                <tr>
                    <th colspan="3">Evening</th>
                </tr>
                <tr>
                    <th>Golden Hour</th>
                    <th>Sunset</th>
                    <th>Blue Hour</th>
                </tr>
                <tr>
                    <td> ${goldenHourPM} to ${sunset}</td>
                    <td>${sunset}</td>
                    <td>${sunset} to ${blueHourPM}</td
                </tr>
                <tr>
                    ${sunsetHTML}
                </tr>
            </table>
        </div>
        </div>`;
    displayHours(hoursHTML);
}

function watchNewLoc() {
    $('.search-container').on('click', '#js-loc-submit', event => {
        console.log('watchNewLoc called');
        event.preventDefault();
        $('.title').hide('slow');
        $('.start-screen').css('margin', '20px auto');
        geoData = null;
        astronomyData = null;
        hourlyData = null;
        restData = null;
        hotelData = null;
        $('.js-results, .js-results-loc, .js-rest-list, .js-hotel-list, #js-error-message').hide('slow').empty();
        $('#js-7day-button').removeAttr('disabled');
        const location = $('#js-location').val().trim();
        console.log(location)
        if (!location) {
            $('#js-error-message').text('Please enter a location').show('fast');
        }
        else if (location.length === 5 && $.isNumeric(location)) {
            createWeatherGeoQuery(location);
        }
        else {
            createGeoWeatherQuery(location);
        }
    });
}

function watch7Days() {
    $('.js-button-container').on('click', '#js-7day-button', event => {
        console.log('watch7Days called');
        event.preventDefault();
        if ($('#day-1').text().length === 0) {
          for (let i=1; i < astronomyData.astronomy.astronomy.length; i++) {
              makeGH(i);
          }

        }
        $('#day-0').get(0).scrollIntoView({behavior: 'smooth'});
    });
}

function watchSuggestion() {
    const suggestions = ['Fenway Park', 'San Francisco', 'London', 'Sydney Opera House', 'Venice', 'Statue of Liberty', 'Paris', '1600 Pennsylvania Ave NW, Washington, DC 20500', 'Miami', 'Golden Gate Bridge']
    $('.search-container').on('click', 'a', event => {
        event.preventDefault();
        console.log('watchSuggestion called');
        $('#js-location').val(suggestions[Math.floor(Math.random()*10)])
    });
}

function watchRestaurants() {
    $('.js-button-container').on('click', '#js-rest-button', event => {
        console.log('watchRestaurants called');
        if ($('.js-rest-list').text().length === 0) {
            createSearchQuery('restaurant');
        }
        else {
          //$('.js-rest-list').toggle('slow');
          $('#rest-list').get(0).scrollIntoView({behavior: 'smooth'});
        }
    });
}

function watchHotels() {
    $('.js-button-container').on('click', '#js-hotel-button', event => {
        console.log('watchHotels called');
        if ($('.js-hotel-list').text().length === 0) {
            createSearchQuery('hotel');
        }
        else {
          //$('.js-hotel-list').toggle('slow');
          $('#hotel-list').get(0).scrollIntoView({behavior: 'smooth'})
        }
    });
}

function handleApp() {
    watchNewLoc();
    watchSuggestion();
    watchRestaurants();
    watchHotels();
    watch7Days();
}

$(handleApp);