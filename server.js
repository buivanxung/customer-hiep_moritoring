
// Setup basic express server
var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var socket = require('socket.io-client')('http://demo.phadistribution.com:5000');
app.engine('html', require('ejs').renderFile);
app.use(require('stylus').middleware({ src: __dirname + '/' }));
app.use(express.static(__dirname + '/'));
app.set('view engine', 'ejs');
app.set('views', __dirname + '/');

// Routing
app.get('/',function(req,res){
    res.render('index', { title: 'Moritoring' });
})

var pg = require('pg')

var configpg = {
  user:'datalora',
  database: 'loradb',
  password: '1234567',
  host: 'localhost',
  port: 5432,
  max:10,
  idleTimeoutMillis:30000,
};

var pool = new pg.Pool(configpg);
socket.on('server_feedback', function(data) {
    var name = "Hiep";
    var res = data.split(",");
    var tempt = res[0].split("=");
    var tempt_v = tempt[1];
    var cond = res[1].split("=");
    var cond_v = cond[1];
    var oxy = res[2].split("=");
    var oxy_v = oxy[1];
    var ph = res[3].split("=");
    var ph_v = ph[1];
    var bat = res[4].split("=");
    var bat_v = bat[1];
    pool.connect(function (err, client, done) {
          if (err) {
            return console.error('error fetching client from pool', err)
          }
          client.query("INSERT INTO public.moritoring(name, temperature, conductivity, oxy, ph, battery, created_at, updated_at) VALUES('"+name+"','"+tempt_v+"','"+cond_v+"','"+oxy_v+"','"+ph_v+"','"+bat_v+"','Now()','Now()')", function(err, result) {
            done();
            if (err) {
              return console.error('error happened during query', err)
            }
          })
        })
    console.log("R"+ data);
    });
http.listen(5000, function () {
  console.log("Server running");
});
