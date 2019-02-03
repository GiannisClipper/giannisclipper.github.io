Code developed for demo and educational purposes. Creates one or more widgets inside a web page showing information about the weather and the local time in any place of the world. 

Code gets information making requests to third party APIs:
- From api.openweathermap.org gets weather data, with requests commited via gc-info.herokuapp.com (custom server written in Flask/Python) to bypass Cross Origin blocks.
- From tech.yandex.com/translate/ gets translated location names (via gc-info.herokuapp.com too). 
- From api.timezonedb.com gets local times, with requests commited (via gc-info.herokuapp.com too).
- From ipapi.co gets location coordinates that corresponds to client IP, with requests straight from the client.

User should include in head section a tag like this:
- <script src='widget-weather-and-clock.js'></script> 
and in body section one or more tags like this:
- <script>new WeatherApiWidget({latitude:37.983810, longitude:23.727539, timeRefresh:600000, width:180 border:'1px solid darkgreen', background:'cyan', color:'darkgreen'});</script>
or even like this: 
- <script>new WeatherApiWidget();</script>

All arguments are optional:
- Latitude and longitude represent location coordinates on the map, if ommitted the code automatically place them with coordinates that corresponds to client IP. 
- TimeRefresh (in milliseconds) define how frequent data refresh, if ommitted the default value is 900000 (15 minutes). 
- Width, border, background and color corresponds to CSS values (widget's styling is isolated from document general styling).

Live demo here https://giannisclipper.github.io/widget-weather-and-clock/

Athens 2 Feb 2019, Giannis Clipper