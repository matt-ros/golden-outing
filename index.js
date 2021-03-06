'use strict';

const STORE = {
    key: 'pFfcXSfgYVfQMIMhlBxuDMZaFrbBSxDBfrF3SToyMYY',
    gKey: 'AIzaSyC_oOddO8wOobo7U9amQ5RJlm6z9UDwIE0',
    weatherBase: 'https://weather.ls.hereapi.com/weather/1.0/report.json',
    searchBase: 'https://browse.search.hereapi.com/v1/browse',
    geoBase: 'https://geocode.search.hereapi.com/v1/geocode',
    mapBase: 'https://www.google.com/maps/embed/v1/place',
    geoData: null,
    astronomyData: null,
    hourlyData: null,
    currentConditionsData: null,
    restData: null,
    hotelData: null
}

// Format paramaters into URL-encoded query string for API calls.

function formatQueryParams(params) {
    const queryItems = Object.keys(params)
        .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`);
    return queryItems.join('&');
}

// All of the `createXxxxxxQuery` functions (as well as createGeoFromWeather)
// call their APIs and then call further functions using the response data.

function createWeatherGeoQuery(loc) {
    const params = {
        apiKey: STORE.key,
        name: loc,
        metric: false,
        product: 'forecast_astronomy'
    }
    const queryString = formatQueryParams(params);
    const weatherUrl = STORE.weatherBase + '?' + queryString;

    fetch(weatherUrl)
        .then(response => {
            if (response.ok) {
                return response.json();
            }
            throw new Error(response.statusText);
        })
        .then(responseJson => {
            STORE.astronomyData = responseJson;
            const coord = `${STORE.astronomyData.astronomy.latitude},${STORE.astronomyData.astronomy.longitude}`;
            createGeoFromWeather(loc, coord);
        })
        .catch(error => {
            $('#js-error-message').text(`Something went wrong: ${error.message}. Please try again.`).show('slow');
        });
}

function createGeoFromWeather(loc, coord) {
    const params = {
        apiKey: STORE.key,
        q: loc,
        at: coord,
        lang: 'en-US'
    }
    const queryString = formatQueryParams(params);
    const geoUrl = STORE.geoBase + '?' + queryString;

    fetch(geoUrl)
        .then(response => {
            if (response.ok) {
                return response.json();
            }
            throw new Error(response.statusText);
        })
        .then(responseJson => {
            STORE.geoData = responseJson;
            if (STORE.geoData.items.length > 0) {
                createWeatherQuery('hourly');
                createWeatherQuery('observation');
                createSearchQuery('restaurant');
                createSearchQuery('hotel');
            }
            else {
                throw new Error('Please enter a valid location.');
            }
        })
        .catch(error => {
            $('#js-error-message').text(`Something went wrong: ${error.message}. Please try again.`).show('slow');
        });
}

function createSearchQuery(category) {
    const params = {
        apiKey: STORE.key,
        at: `${STORE.geoData.items[0].position.lat},${STORE.geoData.items[0].position.lng}`,
        limit: 10,
        lang: 'en-US'
    }
    if (category === 'restaurant') {
        params.categories = '100-1000';
    }
    if (category === 'hotel') {
        params.categories = '500-5000,500-5100-0057,500-5100-0058';
    }
    const queryString = formatQueryParams(params);
    const searchUrl = STORE.searchBase + '?' + queryString;

    fetch(searchUrl)
        .then(response => {
            if (response.ok) {
                return response.json();
            }
            throw new Error(response.statusText);
        })
        .then(responseJson => {
            if (category === 'restaurant') {
                STORE.restData = responseJson;
            }
            if (category === 'hotel') {
                STORE.hotelData = responseJson;
            }

        })
        .catch(error => {
            $('#js-error-message').text(`Something went wrong: ${error.message}. Please try again.`).show('slow');
        });
}

function createGeoWeatherQuery(loc) {
    const params = {
        apiKey: STORE.key,
        q: loc,
        lang: 'en-US'
    }
    const queryString = formatQueryParams(params);
    const geoUrl = STORE.geoBase + '?' + queryString;

    fetch(geoUrl)
        .then(response => {
            if (response.ok) {
                return response.json();
            }
            throw new Error(response.statusText);
        })
        .then(responseJson => {
            STORE.geoData = responseJson;
            if (STORE.geoData.items.length > 0) {
                createWeatherQuery('astronomy');
                createWeatherQuery('hourly');
                createWeatherQuery('observation');
                createSearchQuery('restaurant');
                createSearchQuery('hotel');
            }
            else {
                throw new Error('Please enter a valid location.');
            }
        })
        .catch(error => {
            $('#js-error-message').text(`Something went wrong: ${error.message}`).show('slow');
        });
}

function createWeatherQuery(type) {
    const params = {
        apiKey: STORE.key,
        latitude: STORE.geoData.items[0].position.lat,
        longitude: STORE.geoData.items[0].position.lng,
        product: `forecast_${type}`,
        metric: false
    }
    if (type === 'observation') {
        params.product = `${type}`;
        params.oneobservation = true;
    }
    const queryString = formatQueryParams(params);
    const weatherUrl = STORE.weatherBase + '?' + queryString;

    fetch(weatherUrl)
        .then(response => {
            if (response.ok) {
                return response.json();
            }
            throw new Error(response.statusText);
        })
        .then(responseJson => {
            if (type === 'astronomy') {
                STORE.astronomyData = responseJson;
            }
            if (type === 'hourly') {
                STORE.hourlyData = responseJson;
            }
            if (type === 'observation') {
                STORE.currentConditionsData = responseJson;
            }
            if (STORE.astronomyData !== null && STORE.hourlyData !== null && STORE.currentConditionsData !== null) {
                displayHours();
            }
        })
        .catch(error => {
            $('#js-error-message').text(`Something went wrong: ${error.message}. Please try again.`).show('slow');
        });
}

// Generate HTML for the embedded Google Map.

function makeMap() {
    const params = {
        key: STORE.gKey,
        q: STORE.geoData.items[0].address.label
    }
    if (STORE.geoData.items[0].resultType === 'locality') {
        params.q = `${STORE.geoData.items[0].position.lat},${STORE.geoData.items[0].position.lng}`;
    }
    const queryString = formatQueryParams(params);
    const mapUrl = STORE.mapBase + '?' + queryString;
    return `<iframe width="800" height="450" style="border:0" src="${mapUrl}" allowfullscreen></iframe>`;
}

// Display restaurant and hotel lists with generated HTML.

function displayRestList() {
    if ($('.js-rest-list').text().length === 0) {
        $('.js-rest-list').html(makeRestList());
    }
    $('#rest-list').show('slow');
    $('#rest-list').get(0).scrollIntoView({ behavior: 'smooth' });
}

function displayHotelList() {
    if ($('.js-hotel-list').text().length === 0) {
        $('.js-hotel-list').html(makeHotelList());
    }
    $('#hotel-list').show('slow');
    $('#hotel-list').get(0).scrollIntoView({ behavior: 'smooth' });
}

// Generate HTML for restaurant and hotel lists.

function makeRestList() {
    let restListHTML = '<h3>Nearest Restaurants</h3>';
    if (STORE.restData.items.length === 0) {
        restListHTML += '<p>No restaurants found</p>';
    }
    else {
        restListHTML += '<ol>';
        for (let i = 0; i < STORE.restData.items.length; i++) {
            restListHTML += `<li><a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(STORE.restData.items[i].address.label)}" target="_blank">${STORE.restData.items[i].address.label}</a><br><br></li>`
        }
        restListHTML += '</ol>';
    }
    return restListHTML;
}

function makeHotelList() {
    let hotelListHTML = '<h3>Nearest Hotels</h3>';
    if (STORE.hotelData.items.length === 0) {
        hotelListHTML += '<p>No hotels found</p>';
    }
    else {
        hotelListHTML += '<ol>'
        for (let i = 0; i < STORE.hotelData.items.length; i++) {
            hotelListHTML += `<li><a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(STORE.hotelData.items[i].address.label)}" target="_blank">${STORE.hotelData.items[i].address.label}</a><br><br></li>`
        }
        hotelListHTML += '</ol>';
    }
    return hotelListHTML;
}

// Generate HTML for current weather conditions.

function makeCurrentConditions() {
    const observation = STORE.currentConditionsData.observations.location[0].observation[0];
    const iconFilename = observation.iconLink.substring(observation.iconLink.lastIndexOf('/') + 1);
    return `<h2>Displaying results for ${STORE.geoData.items[0].address.label}</h2>${makeMap()}<h3>Current Conditions</h3><p>${observation.description} Temp: ${parseInt(observation.temperature, 10)}&deg;F. Wind ${observation.windDescShort} at ${parseInt(observation.windSpeed, 10)} mph.<br><img src="./images/weather-icons/${iconFilename}" alt="${observation.iconName}">`;
}

function getForecastIndex(forecastTime) {
    for (let i = 0; i < STORE.hourlyData.hourlyForecasts.forecastLocation.forecast.length; i++) {
        if (STORE.hourlyData.hourlyForecasts.forecastLocation.forecast[i].localTime === forecastTime) {
            return i;
        }
    }
    return -1;
}

// Reformat date portion of UTC time string to match style used in hourly
// forecast.

function parseLocalTime(utcTime) {
    const rawDate = utcTime.substring(0, utcTime.indexOf('T'));
    const dateArray = rawDate.split('-');
    return `${dateArray[1]}${dateArray[2]}${dateArray[0]}`;
}

// Retrieve forecasts for a given hour, plus an hour before and after.

function getForecast(hour, utcTime) {
    const forecastDate = parseLocalTime(utcTime);
    const forecastTime = `${hour}${forecastDate}`;
    const forecastIndex = getForecastIndex(forecastTime);
    if (forecastIndex === -1) {
        return 'No Forecast data available'
    }
    else {
        return [STORE.hourlyData.hourlyForecasts.forecastLocation.forecast[forecastIndex - 1], STORE.hourlyData.hourlyForecasts.forecastLocation.forecast[forecastIndex], STORE.hourlyData.hourlyForecasts.forecastLocation.forecast[forecastIndex + 1]];
    }
}

// Convert the hour portion of a 12-hour formatted time to 24-hour format.

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

// Reformat date portion of a UTC time string to be more human friendly.

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

// Add an hour to sunrise or subtract an hour from sunset to create the time
// for Golden Hour.

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

// Subtract an hour from sunrise or add an hour to sunset to create the time
// for Blue Hour.

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

// Generate HTML for forecasts.

function createForecast(fcast) {
    if (fcast === 'No Forecast data available') {
        return `<td colspan="3">${fcast}</td>`;
    }
    let forecastHTML = '';
    for (let i = 0; i < fcast.length; i++) {
        if (fcast[i] === undefined) {
            forecastHTML += '<td>No data available</td>';
            continue;
        }
        const iconFilename = fcast[i].iconLink.substring(fcast[i].iconLink.lastIndexOf('/') + 1);
        forecastHTML += `<td class="fcast">${fcast[i].description}<br>Temp: ${parseInt(fcast[i].temperature, 10)}&deg;F.<br>Wind ${fcast[i].windDescShort} at ${parseInt(fcast[i].windSpeed, 10)} mph.<br>Chance of precipitation: ${fcast[i].precipitationProbability}%<br><img src="./images/weather-icons/${iconFilename}" alt="${fcast[i].iconName}"></td>`;
    }
    return forecastHTML;
}

// On new location search, call API query functions to populate data.

function getData(location) {
    if (location.length === 5 && $.isNumeric(location)) {
        createWeatherGeoQuery(location);
    }
    else {
        createGeoWeatherQuery(location);
    }
    
}

// Display generated HTML for Golden/Blue hour times and forecasts for a single
// day.

function displayHours(day = 0) {
    if ($('.js-results').text().length === 0) {
        $('.js-results-loc').html(makeCurrentConditions()).show('slow');
    }
    $('.js-results').append(makeGH(day));
    $('.js-results, .js-button-container, #js-loc-refine').show('slow').removeClass('hidden');
    $('.js-button-container').css('display', 'flex');
}

// Show or hide forecast data as appropriate.

function showHideForecast() {
    if ($('.js-results').css('display') === 'none') {
        $('.js-results').show();
        $('.js-results').get(0).scrollIntoView({ behavior: 'smooth' });
    }
    else {
        $('.js-results').hide('slow');
    }
}

// Generate HTML for each forecast day.

function makeGH(day) {
    const sunrise = STORE.astronomyData.astronomy.astronomy[day].sunrise;
    const sunset = STORE.astronomyData.astronomy.astronomy[day].sunset;
    const utcTime = STORE.astronomyData.astronomy.astronomy[day].utcTime;
    const sunriseHour = getHour(sunrise);
    const sunsetHour = getHour(sunset);
    const date = parseDate(utcTime);
    const goldenHourAM = calcGH(sunrise);
    const goldenHourPM = calcGH(sunset);
    const blueHourAM = calcBH(sunrise);
    const blueHourPM = calcBH(sunset);
    const sunriseForecast = getForecast(sunriseHour, utcTime);
    const sunsetForecast = getForecast(sunsetHour, utcTime);
    const sunriseHTML = createForecast(sunriseForecast);
    const sunsetHTML = createForecast(sunsetForecast);
    return `<div class="day">
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
}

// Event listener for new location search. Clear displayed data and API data
// and initialize new search.

function watchNewLoc() {
    $('.search-container').on('click', '#js-loc-submit', event => {
        event.preventDefault();
        $('.title').hide('slow');
        $('.start-screen').css('margin', '20px auto');
        STORE.geoData = null;
        STORE.astronomyData = null;
        STORE.hourlyData = null;
        STORE.restData = null;
        STORE.hotelData = null;
        $('.js-results, .js-results-loc, .js-rest-list, .js-hotel-list, #js-error-message').hide('slow').empty();
        const location = $('#js-location').val().trim();
        if (!location) {
            $('#js-error-message').text('Please enter a valid location.').show('fast');
        }
        else {
            getData(location);
        }
    });
}

// Event listener for 7 Day Forecast button. Create forecast and scroll to it,
// or if already created, toggle display of the forecast.

function watch7Days() {
    $('.js-button-container').on('click', '#js-7day-button', event => {
        event.preventDefault();
        if ($('#day-1').text().length === 0) {
            for (let i = 1; i < STORE.astronomyData.astronomy.astronomy.length; i++) {
                displayHours(i);
            }
            $('#day-0').get(0).scrollIntoView({ behavior: 'smooth' });
        }
        else {
            showHideForecast();
        }
    });
}

// Event listener for Suggestion link. Insert a random entry from the array into
// the search box.

function watchSuggestion() {
    const suggestions = ['Fenway Park', 'San Francisco', 'London', 'Sydney Opera House', 'Venice', 'Statue of Liberty', 'Paris', '1600 Pennsylvania Ave NW, Washington, DC 20500', 'Miami', 'Golden Gate Bridge']
    $('.search-container').on('click', 'a', event => {
        event.preventDefault();
        $('#js-location').val(suggestions[Math.floor(Math.random() * 10)])
    });
}

// Event listener for Restaurant button.

function watchRestaurants() {
    $('.js-button-container').on('click', '#js-rest-button', event => {
        displayRestList();
    });
}

// Event listener for Hotel button.

function watchHotels() {
    $('.js-button-container').on('click', '#js-hotel-button', event => {
        displayHotelList();
    });
}

// Callback function triggered on document ready.

function handleApp() {
    watchNewLoc();
    watch7Days();
    watchSuggestion();
    watchRestaurants();
    watchHotels();
}

$(handleApp);