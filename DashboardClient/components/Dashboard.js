import React from 'react';
import Tab from './Tab';
import Search from './SearchComponent';
import LeftTab from './leftTab';
import MidTab from './MidTab';
import RightTab from './RightTab';
import TabPopularTweets from './TabPopularTweets';
import TabNewsHeadlines from './TabNewsHeadlines';
import ReactDOM from 'react-dom';
import Loader from 'halogen/PulseLoader';

import {Grid, Row, Col, Clearfix, Panel, Well, Button, Glyphicon} from 'react-bootstrap';
import {Navbar, Nav, NavItem, NavDropdown, MenuItem, Image, Jumbotron} from 'react-bootstrap';
import {Router, Route, Link, hashHistory, IndexRoute} from 'react-router';


var styles = {
  'background-color': 'black'
}

/****************************************
 * Dashboard 
 * Contains most React Logic to update website 
 * **************************************
 */
class Dashboard extends React.Component {
  constructor(props){
    super(props);
    this.state = {
      map: null,
      countriesArr: [
        ['Argentina', 'AR', 'ARG'],
        ['Australia', 'AU', 'AUS'],
        ['Austria', 'AT', 'AUT'],
        ['Belgium', 'BE', 'BEL'],
        ['Brazil', 'BR', 'BRA'],
        ['Canada', 'CA', 'CAN'],
        ['Chile', 'CL', 'CHL'],
        ['Colombia', 'CO', 'COL'],
        ['France', 'FR', 'FRA'],
        ['Germany', 'DE', 'DEU'],
        ['India', 'IN', 'IND'],
        ['Italy', 'IT', 'ITA'],
        ['Japan', 'JP', 'JPN'],
        ['Malaysia', 'MY', 'MYS'],
        ['Mexico', 'MX', 'MEX'],
        ['Netherlands', 'NL', 'NLD'],
        ['Norway', 'NO', 'NOR'],
        ['Philippines', 'PH', 'PHL'],
        ['Poland', 'PL', 'POL'],
        ['Portugal', 'PT', 'PRT'],
        ['Russia', 'RU', 'RUS'],
        ['Sweden', 'SE', 'SWE'],
        ['Switzerland', 'CH', 'CHE'],
        ['Turkey', 'TR', 'TUR'],
        ['United Kingdom', 'GB', 'GBR'],
        ['United States', 'US', 'USA'],
        ['Vietnam', 'VN', 'VNM']
      ],
      selectedCountry: 'US',
      searchedItem: '',
      trends: [],
      currentTrend: 'Select Trend',
      twitterData:[
        {label: 'positive', score: 50},
        {label: 'negative', score: 50},
      ],
      facebookData:[
        {label: 'loves', score: 20},
        {label: 'wows', score: 20},
        {label: 'hahas', score: 20},
        {label: 'sads', score: 20},
        {label: 'angrys', score: 20},
      ],
      publicSentiment: '',
      emotionalFeedback: '',
      trendHistory: '',
      representativeTweet1: '',
      representativeTweet2: '',
      representativeNewsSource: '',
      twitterSpinner: false,
      facebookSpinner: false, //not likely to be needed
      twitterSummary: '',
      facebookSummary: '',
      NewsTopHeadlines: '',
      facebookLikes: '',
      currentChart: 'twitterChart'

    }
  }


  componentDidMount () {
    //start everything
    this.getTrends();
    this.updateChart(this.state.twitterData, '#sentimentChart');
    this.worldMap();
    this.googleTrendGrab('US');
  }


/**************************
 * Map Component Logic
 **************************/
  handleFormChange (e) {
    var clickedCountry = e.target.value;
    //Toggle former selected country's map color to default
    this.toggleMapColors(clickedCountry);

    //Change the selected country in state
    this.setState({selectedCountry: e.target.value});

    //Toggle new selected country's map color to default
    //Uses setTimeout because the setState requires time to update
    setTimeout(function() {this.toggleMapColors(clickedCountry)}.bind(this), 250);
  }

  toggleMapColors (clickedCountry) {
    //Google's Trend API requires 2-digit country-codes
    //Datamaps requires 3-digit country-codes
    //For loop will find the corresponding 3-digit country-code for selected item
    var countryCode = null;
    for (var i = 0; i < this.state.countriesArr.length; i++) {
      if (this.state.countriesArr[i][1] === this.state.selectedCountry) {
        countryCode = this.state.countriesArr[i][2];
      }
    }

    //Create the object to toggle map color 
    var toggleVar = this.state.map.options.data[countryCode]['fillKey'] === 'SELECTED';
    var fillKey = (toggleVar) ? 'UNSELECTED' : 'SELECTED';
    var obj = {};
    obj[countryCode] = {fillKey: fillKey};

    //Update map color
    this.state.map.updateChoropleth(obj);
  }

  googleTrendGrab (countryCode) {
    console.log('googleTrendGrab countryCode is', countryCode);
    $.get('http://localhost:3000/test', countryCode, function(list) {
      document.getElementById('googleTrendGrabTarget').innerText = list;
    });
  }




  searchTrend (e) {
    this.setState( {
      currentTrend: e
    })

    console.log(this.state.searchedItem);
    if(this.state.currentChart === "twitterChart"){
      this.twitterGrab(e);
    } else {
     // this.facebookGrab(e);
    }
    this.updateNewsTopHeadlines(q);
    this.topTweetGrab(e);
  }

   //pull in data from google trends to populate dropdown menu
  getTrends () {
   
    var context = this;
    $.get('http://localhost:3000/trends', function(data){

      context.setState({
        trends: data
      })

    });
  }


  //pull in twitter data from watson to populate twitter chart
  twitterGrab (q) {
    var context = this;
    this.setState({
      currentTrend: q,
      twitterSpinner: true
    })
  
    $.ajax({
      method: "POST",
      url: 'http://localhost:3000/grabTweets',
      data: JSON.stringify({q: q}),
      contentType: "application/json",
      success: function(d){
        setTimeout(function() {
          console.log(d);
        }, 2000);
        context.setState({
          twitterData: [{label: 'positive', score:d.positive},{label:'negative', score:d.negative}],
          twitterSpinner: false,
          twitterSummary: d.summary
        });
        d3.select('#sentimentChart').selectAll('svg').remove();
        context.updateChart(context.state.twitterData, '#sentimentChart');
      },
      dataType: 'json'
    });
  }


  facebookGrab (q) {
    //grab facebook data for fb chart
    this.setState({
      currentTrend: q
    })
    var context = this;
    $.ajax({
      method: "POST",
      url: 'http://localhost:3000/grabFbook',
      data: JSON.stringify({q: q}),
      contentType: "application/json",
      success: function(d){
        var fbdata = map(d, function(value, prop){
          if (value < 1) {
            return { 
              label: prop,
              score: value
            };
          } else {
            return {
              label: prop,
              score: value
            }
          }
        })
        context.setState({
          facebookData: fbdata,
          facebookSummary: d.summary,
          NewsTopHeadlines: [d.topHeadline, d.secondHeadline],
          facebookLikes: d.likes
        });
        console.log(d.topHeadline);
        console.log('response fb mapped: ', fbdata, d);
        console.log('###$$$$$$$$$$$$$', context.state);
        d3.select('#sentimentChart').selectAll('svg').remove();
        // context.updateChart(context.state.facebookData, '#sentimentChart');
        context.updateDonutChart(context.state.facebookData);

      },
      dataType: 'json'
    });
  }

  topTweetGrab (q) {
    //grab top tweet data to populate representative tweet panel
    var context = this;
    this.setState({
      currentTrend: q
    })


    $.ajax({
      method: "POST",
      url: 'http://localhost:3000/grabTopTweet',
      data: JSON.stringify({q: q}),
      contentType: "application/json",
      success: function(d){
        var tweet = map(d, function(item){
          return item;
        });
        context.setState({
          representativeTweet1user: '@' + tweet[0],
          representativeTweet1headline: tweet[1],
          representativeTweet1time: tweet[2] + ' hours ago',
          representativeTweet2user: '@' + tweet[3],
          representativeTweet2headline: tweet[4],
          representativeTweet2time: tweet[5] + ' hours ago'
        })
      },
      dataType: 'json'
    });
  }

  //Updates all data. API calls for NewsFeed, Twitter are set here 
  allDataGrab (q) {
    //update everything (when new trend is selected)
    this.setState({
      currentTrend: q
    })
    if(this.state.currentChart === "twitterChart"){
      this.twitterGrab(q);
    } else {
      //this.facebookGrab(q);
    }
    this.updateNewsTopHeadlines(q);
    this.topTweetGrab(q);
  }

  updateChart (data, id) {
    var width = 350, //960
        height = 350, //500
        radius = Math.min(width, height) / 2;

    //Ordinal scale w/ default domain and colors for range
    var color = d3.scale.ordinal()
        .range(["#F0AD44","#128085","#FAE8CD","#385052","#C74029"]);



    //create arc data (to define path svg)
    var arc = d3.svg.arc()
        .outerRadius(radius - 10)
        .innerRadius(0);

    var labelArc = d3.svg.arc()
        .outerRadius(radius - 10)
        .innerRadius(0);

    //create pie layout order data
    var pie = d3.layout.pie()
        .sort(null)
        .value(function(d){
          return d.score;
        });
    //append both and svg and a g (group) element to the page. Move it over to the middle
    var svg = d3.select(id).append('svg')
              .attr('class', 'twitterChart')
              .attr('width', width)
              .attr('height', height)
              .append('g')
              .attr('transform', 'translate(' + width / 2 + "," + height / 2 + ')');

    //Apply data to pie and add g's on enter
    var g = svg.selectAll('.arc')
            .data(pie(data))
            .enter()
            .append('g')
            .attr('class', 'arc');

    //put a path element in the g, give it a d attribute of the previously defined arc path. Grab its color from the scale range
    g.append('path')
    .attr('d', arc)
    .style('fill', function(d) {return color(d.data.label);});

    //put svg text elements on each g. Use the cenrtroid method to position center of the slice. Shift the dy positioning. Pull text from data
    g.append('text')
    .attr('transform', function(d){return 'translate('+ labelArc.centroid(d) + ')'; })
    .attr('dy', '.35em')
    .attr('dx', '-.8em')
    .attr('font-size', '15px')
    .text(function(d) {return d.data.label;});
  }

  worldMap() {
    this.state.map = new Datamap({
      element: document.getElementById('worldMapContainer'),
      responsive: true,
      geographyConfig: {
        popupOnHover: true,
        popupTemplate: function(geography, data) { // This function should just return a string
          // var lookup = googleTrendGrab(geography.properties.name);
          return googleTrendGrab(geography.properties.name);
        }
      },
      fills: {
          SELECTED: 'red',
          UNSELECTED: 'green',
          defaultFill: 'gray'
      }
    })

    var selectedCountry = this.state.selectedCountry;
    var map = this.state.map;
    this.state.countriesArr.map(function(triple) {
      var obj = {}
      if(triple[1] === selectedCountry) {
        console.log('inside true')
        obj[triple[2]] = {'fillKey': 'SELECTED'};
      } else {
        console.log('inside false')
        obj[triple[2]] = {'fillKey': 'UNSELECTED'};
      }
      map.updateChoropleth(obj);
    });

    d3.select(window).on('resize', function() {
      map.resize();
    });
  }

// News Component
/**
 * updateNewsTopHeadlines()
 *
 * @param {String} keyword that the news component is searching for
 * @return {Element} updates prop: NewsTopHeadlines
 */
  updateNewsTopHeadlines(keyword) {
    var context = this;
    console.log("updating news headlines.")
    var url = "https://api.nytimes.com/svc/search/v2/articlesearch.json";
    url += '?' + $.param({
      'api-key': "38618d65ade0456985ffee0915ba6299",
      'q': keyword
    });
    $.ajax({
      url: url,
      method: 'GET',
    }).done(function (result) {

      var finalbody = [];
      //Go Through news articles and extract snippit
      result.response.docs.map(function (article, index) {

        //Snippet That is clickable 
        //Number of articles to display 
        if (index < 2) {
          finalbody.push(
            <a href={article.web_url}>
              <div>
                {article.snippet}
              </div></a>)
        }

      })
      context.setState({ NewsTopHeadlines: finalbody });

    }).fail(function (err) {
      throw err;
    });
  }

  updateDonutChart (dataset){
    var width = 350,
        height = 350,
        outerRadius = Math.min(width, height) * .5 - 10,
        innerRadius = outerRadius * .6;

    // var dummyDataSet = [null, 20, 20, 20, 20, 20];
    // console.log('this is the dataset: ', dataset)
    var newDataset = dataset.slice(4);
    // console.log('this is the new and improved dataset: ', newDataset);
    var dataFromServer = map(newDataset, function(item){
      // console.log(item)
      return item.score == null ? 0 : item.score;
    });
    var emoDataset = [null].concat(dataFromServer);
    // console.log('emoDataset', emoDataset);  

    var fTest = function () {
      emoDataset.splice(0, 1);
      return emoDataset[0]; 
    }

    var n = 5,
        data0 = d3.range(n).map(Math.random),
        data1 = d3.range(n).map(fTest),
        data;

    var color = d3.scale.category20();

    var arc = d3.svg.arc();

    var pie = d3.layout.pie()
        .sort(null);

    var svg = d3.select("#sentimentChart").append("svg")
        .attr('class', 'facebookChart')
        .attr("width", width)
        .attr("height", height);

    svg.selectAll(".arc")
        .data(arcs(data0, data1))
      .enter().append("g")
        .attr("class", "arc")
        .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")")
      .append("path")
        .attr("fill", function(d, i) { return color(i); })
        .attr("d", arc);

    transition(1);

    // copied code //

    function arcs(data0, data1) {
      var arcs0 = pie(data0),
          arcs1 = pie(data1),
          i = -1,
          arc;
      while (++i < n) {
        arc = arcs0[i];
        arc.innerRadius = innerRadius;
        arc.outerRadius = outerRadius;
        arc.next = arcs1[i];
      }
      return arcs0;
    }

    // end copied code //

    function transition(state) {
      var path = d3.select('#sentimentChart').selectAll(".arc > path")
          .data(state ? arcs(data0, data1) : arcs(data1, data0));

      var t0 = path.transition()
          .duration(500)
          .attrTween("d", tweenArc(function(d, i) {
            return {
              innerRadius: i & 1 ? innerRadius : (innerRadius + outerRadius) / 2,
              outerRadius: i & 1 ? (innerRadius + outerRadius) / 2 : outerRadius
            };
          }));

      var t1 = t0.transition()
          .attrTween("d", tweenArc(function(d, i) {
            var a0 = d.next.startAngle + d.next.endAngle,
                a1 = d.startAngle - d.endAngle;
            return {
              startAngle: (a0 + a1) / 2,
              endAngle: (a0 - a1) / 2
            };
          }));

      var t2 = t1.transition()
            .attrTween("d", tweenArc(function(d, i) {
              return {
                startAngle: d.next.startAngle,
                endAngle: d.next.endAngle
              };
            }));

      var t3 = t2.transition()
          .attrTween("d", tweenArc(function(d, i) {
            return {
              innerRadius: innerRadius,
              outerRadius: outerRadius
            };
          }));
    }

    function tweenArc(b) {
      return function(a, i) {
        var d = b.call(this, a, i), i = d3.interpolate(a, d);
        for (var k in d) a[k] = d[k]; // update data
        return function(t) { return arc(i(t)); };
      };
    }
  }



/**
 * toggleChart() 
 * logic that toggles sentiment chart in the Sentiment analysis component
 *
 * @param {String} tag
 * @return {Element} element
 */
  toggleChart () {
    var currentChart = d3.select('#sentimentChart').selectAll('svg');
    var currentChartClass = currentChart[0][0].className.animVal;
    d3.select('#sentimentChart').selectAll('svg').remove();
    if(currentChartClass === "twitterChart") {
      this.updateDonutChart(this.state.facebookData);
      this.setState({currentChart: 'facebookChart'});
    } else {
      this.updateChart(this.state.twitterData, '#sentimentChart');
      this.setState({currentChart: 'twitterChart'});
    }
  }




/**
 * render() updates the DOM
 */
  render () {
    var header = {
      backgroundColor: '#394264',
      fontColor: 'white',
      borderColor: 'rgba(231, 231, 231, 0)',
      marginTop: '2.5%',

      height: '65px',
      fontSize: '17px',
      borderRadius: '5px'
    }

    var headerli = {

      padding: '0 10px',
      display: 'block',
      lineHeight: '74px',
      fontSize: '17px',
      webkitTransition: 'background .3s',
      transition: 'background .3s',

      marginTop: '10px'
    }

    var liColor = {
      textColor: 'white'
    }

    var outline = {
      backgroundColor: 'rgb(57, 66, 100)',
      height: '485px' ,
      borderRadius: '5px'
    }

    var titular = {
    display: 'block',
    lineHeight: '50px',
    textAlign: 'center',
    borderTopLeftRadius: '5px',
    borderTopRightRadius: '5px',
    fontSize: '17px',
    color: 'rgb(255, 255, 255)',
    fontWeight: 'bold',
    background: '#35aadc'
    }

    var glyphOffset = {
      marginRight:'15px',
      fontSize:'25px',
      marginBottom: '10px'
    }

    var sentimentChart = {
      position: 'relative',
      left: '70%',
      top: '2%',
      WebkitTransform: 'translateX(-50%)',
      mstransform: 'translateX(-50%)',
      transform: 'translateX(-50%)',
      paddingRight: '27.5px'
    }

    // var mapStyle = {
    //   position: relative,
    //   width: 500px,
    //   height: 300px
    // }


    return (
      
      <Grid>
          <Row>
            <Navbar style={header}>
              <Navbar.Header>
                <Navbar.Brand style={headerli}>
                  <a href="#" ><Glyphicon glyph="signal" style ={glyphOffset}/>Trend Wave</a>
                </Navbar.Brand>
              </Navbar.Header>
              <Nav style={headerli}>
                <NavDropdown style={liColor} eventKey={1} title="Current Trends" id="basic-nav-dropdown" >
                  <MenuItem style={liColor} eventKey={1.1} >Select Trend</MenuItem>
                  <MenuItem divider />
                  <MenuItem />
                  {
                    this.state.trends.map(function(trend, index) {
                      var eKey = Number('1.' + (index + 1));
                      var context = this;
                      var handler = function(){
                        context.allDataGrab(trend);
                      }
                      return <MenuItem eventKey={eKey} key={index} onClick={handler}>{trend}</MenuItem>
                    }.bind(this))
                  }
                </NavDropdown>
                <Button onClick={this.toggleChart.bind(this)}>Toggle Display</Button>
              </Nav>
              <Search search={this.searchTrend.bind(this)} />
            </Navbar>
          </Row>
          <Row>

            <Col xs={6} md={4}><LeftTab info={this.state.trendHistory} header={this.state.currentTrend} sub={"Trend Score: " + Math.ceil(Math.random()  * 100)}/></Col>
            <Col xs={6} md={4}><MidTab loading={this.state.twitterSpinner} info={this.state.publicSentiment} header="PUBLIC SENTIMENT" sub={this.state.twitterSummary}/></Col>
            <Col xs={6} md={4}><RightTab info={this.state.emotionalFeedback} header={"EMOTIONAL FEEDBACK"} sub={this.state.facebookSummary}/></Col>
          </Row>
          <Row>
            <Col md={6} mdPush={6}>
              <Row>  

                <TabPopularTweets info={this.state.trendHistory} header="MOST POPULAR TWEETS" sub1={this.state.representativeTweet1user} sub2={this.state.representativeTweet1headline} sub3={this.state.representativeTweet1time} sub4={this.state.representativeTweet2user} sub5={this.state.representativeTweet2headline} sub6={this.state.representativeTweet2time}/>
              </Row>
              <Row>
                <TabNewsHeadlines info={this.state.trendHistory} header="MOST POPULAR HEADLINES" sub1={this.state.NewsTopHeadlines[0]}  sub2={this.state.NewsTopHeadlines[1]} />
              </Row>
            </Col>
            <Col md={6} mdPull={6}>
              <div style={outline}>
                <h1 style={titular}>SENTIMENT ANALYSIS</h1>
                <div id="sentimentChart" style={sentimentChart}>
                  {this.state.twitterSpinner ? <Loader color="#26A65B " size="16px" margin="4px"/> : <div></div>}
                </div>
                {this.state.currentChart == 'facebookChart' ?  
                  <div>
                    <ul className="legend horizontal-list">
                        <li>
                            <p className="love split scnd-font-color">Love</p>
                            <p className="percentage">N/A<sup>%</sup></p>
                        </li>
                        <li>
                            <p className="shocked split scnd-font-color">Shocked</p>
                            <p className="percentage">N/A<sup>%</sup></p>
                        </li>
                        <li>
                            <p className="funny split scnd-font-color">Funny</p>
                            <p className="percentage">N/A<sup>%</sup></p>
                        </li>
                        <li>
                            <p className="sad split scnd-font-color">Sad</p>
                            <p className="percentage">N/A<sup>%</sup></p>
                        </li>
                        <li>
                            <p className="angry split scnd-font-color">Angry</p>
                            <p className="percentage">N/A<sup>%</sup></p>
                        </li>
                    </ul>
                  </div> 
                  : ''} 
              </div>
            </Col>
          </Row>
          <Row>
            <div style={outline}>
              <h1 style={titular}>World Map</h1>
              <div id="worldMapContainer" style={{top: '-15%', height: '90%'}}></div>
              <form onSubmit={this.googleTrendGrab(this.state.selectedCountry)}>
                <p style={{color: 'white'}}>Select a country:</p>
                <select id="countriesDropDown" name="Countries" value={this.state.selectedCountry}
                  onChange={this.handleFormChange.bind(this)}>{
                  this.state.countriesArr.map(function(tuple) {
                    return <option value={tuple[1]}>{tuple[0]}</option>
                  })
                }</select>
              </form>
            </div>
          </Row>
          <Row>
            <div id='googleTrendGrabTarget' style={{color: 'white'}}></div>
          </Row>
      </Grid>
    );
  }
}

export default Dashboard;


var map = function(obj, cb){
  var result = [];
  for(var i in obj){
    result.push(cb(obj[i], i, obj));
  }
  return result;
}