/*
                  +----------------+
          +-----> | class ClockApi | -------+
+-----------+     +----------------+        |  
| class Api |                               V
+-----------+     +-----------------+     +------------------------+
          +-----> | class ApiWidget | --> | class WeatherApiWidget |
                  +-----------------+     +------------------------+
*/

class Api {
  constructor(api, timeRefresh, timeRetry, limitRetry) {
    this.api=!api?null:api;
    this.timeRefresh=!timeRefresh?0:timeRefresh; //delay to refresh request (milliseconds), by default 0 (false)
    this.timeRetry=!timeRetry?0:timeRetry; //delay to retry when response is an error (milliseconds), by default 0 (false)
    this.limitRetry=!limitRetry?4:limitRetry; //to control number of retries, by default 4
    this.countRetry;
  }

  run() {
    //first request immediately then according to timeRefresh delay
    this.countRetry=0;
    this.requestApi();
    if (this.timeRefresh)
      setInterval(()=> {
        this.countRetry=0;
        this.requestApi();
      }, Math.max(this.timeRefresh, 5000)); //minimum interval 5''
  }

  requestApi() {
    console.log('requestApi:', this.api);
    fetch(this.api)
    .then(res=> res.json())
    .then(res=> this.callback(res))
    .catch(err=> {
      console.log('requestApi:', err.message);
      this.countRetry+=1;
      if (this.timeRetry && this.countRetry<=this.limitRetry)
        setTimeout(()=>this.requestApi(), this.timeRetry);
    });
  }

  callback(res) {
    return res;
  }
}

//-----------------------------------------------------------------------------

class ClockApi extends Api {

  constructor(api, timeRefresh, timeRetry, limitRetry, output) {
    super(api,
      !timeRefresh?null:timeRefresh, 
      !timeRetry?null:timeRetry, 
      !limitRetry?null:limitRetry);
    
    this.timestamp;
    this.output=!output?(timestamp)=>{return timestamp;}:output; //to display the time
    this.minuteRefresh; //interval to update time per minute
    this.systemTime; //track system time to quarantee timestamp accuracy (time update is
                    //based on interval and not a request and when pc suspended update stop) 
  }

  callback(res) {
    //console.log(res.countryName, res.formatted);
    //multiple widgets in same page may have few seconds delay between initializations
    //rounding the seconds widgets time synchronization is more accurate
    this.timestamp=Math.round(Number(res.timestamp)/60)*60;
    this.output(this.timestamp);
    this.systemTime=Date.now();
    this.minuteRefresh=setInterval(()=> {
      this.systemTime+=60000; //js date in milliseconds
      if (Math.round(this.systemTime/10000)!==Math.round(Date.now()/10000)) { //check accuracy on minutes
        this.run();
        clearInterval(this.minuteRefresh);
      }
      this.timestamp+=60; //unix timestamp in seconds
      this.output(this.timestamp);
    }, 60000);  //refresh per minute 
  }
}

//-----------------------------------------------------------------------------

class ApiWidget extends Api {

  constructor(api, timeRefresh) {
    super(api, !timeRefresh?null:timeRefresh);
     //define widget's root <tag> and place it in current script position in document
    this.$body=document.createElement('div');  
    let $script=document.currentScript || (()=> document.getElementsByTagName('script')[-1])();
    $script.parentElement.appendChild(this.$body);
  }

  callback(res) {
    this.$body.textContent=res;
  }
}

//-----------------------------------------------------------------------------

class WeatherApiWidget extends ApiWidget {

  constructor(args) {
    super();
    this._location={en:null, gr:null};
    //this.origin='http://localhost:5000';
    this.origin='https://gc-info.herokuapp.com'; 

    this.args=args?args:{};
    this.initArgs(args);
    this.initHTML();
    this.initStyle(args);
    this.initClock();
    this.initTooltip();

    this.timeRefresh=args['timeRefresh'];

    //given coords by user
    if (args['latitude'] && args['longitude']) {
      this.continueConstruct(args['latitude'], args['longitude'])
    
    //or locate coords from ip
    } else {
      fetch('https://ipapi.co/json/')
      .then(res=> res.json())
      .then(res=> {
        this.location=res.city;
        this.continueConstruct(res.latitude, res.longitude);
      })
      .catch(err=> consolre.log('ipapi.co:', err.message));
    }
  }

  set location(name) {
    this._location.en=name;
  }

  get location() {
    return this._location.en;
  }

  async locationInGreek() {
    if (!this._location.gr) {
      let res=await fetch(`${this.origin}/api/translate?lang=en-el&text=${this._location.en}`);
      res=await res.json();
      this._location.gr=res.text[0];
    }
    return this._location.gr;
  }

  getIcon(name) { 
    //substitute openweather icons
    let path=`./icons/`;
    if (name==='01d') return `${path}01d.png`;
    else if (name==='01n') return `${path}01n.png`;
    else if (name==='02d') return `${path}02d.png`;
    else if (name==='02n') return `${path}02n.png`;
    else if (name==='03d') return `${path}03d03n04d04n.png`;
    else if (name==='03n') return `${path}03d03n04d04n.png`;
    else if (name==='04d') return `${path}03d03n04d04n.png`;
    else if (name==='04n') return `${path}03d03n04d04n.png`;
    else if (name==='09d') return `${path}09d09n.png`;
    else if (name==='09n') return `${path}09d09n.png`;
    else if (name==='10d') return `${path}10d10n.png`;
    else if (name==='10n') return `${path}10d10n.png`;
    else if (name==='11d') return `${path}11d11n.png`;
    else if (name==='11n') return `${path}11d11n.png`;
    else if (name==='13d') return `${path}13d13n.png`;
    else if (name==='13n') return `${path}13d13n.png`;
    else if (name==='50d') return `${path}50d50n.png`;
    else if (name==='50n') return `${path}50d50n.png`;
    else return `http://openweathermap.org/img/w/${name}.png`;
  }

  continueConstruct(latitude, longitude) {
    this.latitude=latitude;
    this.longitude=longitude;
    this.api=`${this.origin}/api/weather?lang=el&latitude=${this.latitude}&longitude=${this.longitude}`;
    this.run();
    this.clock.api=`${this.origin}/api/clock?latitude=${this.latitude}&longitude=${this.longitude}`;
    this.clock.run();
  }

  initArgs(args) {
    args['latitude']=args['latitude']?args['latitude']:null;
    args['longitude']=args['longitude']?args['longitude']:null;
    args['timeRefresh']=args['timeRefresh']?args['timeRefresh']:900000; //default refresh 15'
    args['width']=args['width']?`${parseInt(args['width'])}px`:'200px';
    args['border']=args['border']?args['border']:'0px';
    args['background']=args['background']?args['background']:'lightskyblue';
    args['color']=args['color']?args['color']:'brown';
    args['font-size']=`${Math.round(parseInt(args['width'])/14)}px`;
  }

  initHTML() {
    this.$body.className='widget-weather-and-clock';
    this.$body.innerHTML=`
      <p><span class="location"></span><span class="localtime"></span></p>
      <p><span class="temperature"></span> &#8451;</p>
      <img class="icon"/>
      <p>
      <span class="description"></span>
      <span class="humidity"></span>
      <span class="wind"></span>
      </p>
      <span class="tooltip"></span>
    `;
  }

  initStyle(args) {    
    this.$body.style.width=args['width'];
    this.$body.style.border=args['border'];
    this.$body.style.background=args['background']; 
    this.$body.style.fontSize=args['font-size'];
    this.$body.style.color=args['color'];

    this.$body.querySelector('.location').style.fontSize='1.25em';
    this.$body.querySelector('.localtime').style.border=`1px dotted ${args['color']}`;
    this.$body.querySelector('.temperature').style.fontSize='1.50em';
    //this.$body.querySelector('.description').style.fontSize='1.20em';
    this.$body.querySelector('.tooltip').style.fontSize='0.75em';
  }

  initClock() {
    this.clock=new ClockApi(null, null, 1000, 8, timestamp=> {
      let date=new Date(timestamp*1000); //unix timestamp is in seconds but js date() is in milliseconds
      let hours='0'+date.getUTCHours();
      let minutes='0'+date.getUTCMinutes();
      this.$body.querySelector('.localtime').textContent=(hours.substr(-2)+':'+minutes.substr(-2));
    });
  }

  initTooltip() {
    this.$body.addEventListener('mouseover', ()=>this.$body.querySelector('.tooltip').style.visibility='visible'); 
    this.$body.addEventListener('mouseout', ()=>this.$body.querySelector('.tooltip').style.visibility='hidden'); 
  }

  async callback(res) {
    if (res.weather) {
      this.location=this.location?this.location:res.name;
      this.$body.querySelector('.location').textContent=await this.locationInGreek();
      this.$body.querySelector('.icon').src=this.getIcon(res.weather[0].icon);
      this.$body.querySelector('.temperature').textContent=Math.round(Number(res.main.temp));
      this.$body.querySelector('.description').textContent=noTon(res.weather[0].description.toUpperCase());
      this.$body.querySelector('.humidity').textContent=`ΥΓΡΑΣΙΑ ${res.main.humidity}%`;
      this.$body.querySelector('.wind').textContent=`ΑΝΕΜΟΙ ${Math.round(Number(res.wind.speed))}`;
      this.$body.querySelector('.tooltip').textContent=`updated ${(new Date).toString().slice(16,24)}`;
    } else {
      this.$body.querySelector('.tooltip').textContent='no response';
    }
  }
}

function noTon(text) {
  //general string function removes greek intonation
  let charsInTon=['Ά','Έ','Ή','Ί','Ό','Ύ','Ώ','ά','έ','ή','ί','ό','ύ','ώ'];
  let charsNoTon=['Α','Ε','Η','Ι','Ο','Υ','Ω','α','ε','η','ι','ο','υ','ω'];
  for (i=0; i<charsInTon.length; i++) {
    text=text.replace(charsInTon[i], charsNoTon[i]);
  }
  return text;
}

//code start running from here
let cssFile='widget-weather-and-clock';
if (!document.querySelector(`#${cssFile}`)) {
    let head=document.getElementsByTagName('head')[0];
    let link=document.createElement('link');
    link.id=cssFile;
    link.rel='stylesheet';
    link.type='text/css';
    link.href=cssFile+'.css';
    link.media='all';
    head.appendChild(link);
}
