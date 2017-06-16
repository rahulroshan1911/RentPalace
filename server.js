var express = require('express');
var path = require('path');
var bodyParser = require('body-parser');
var request = require('request');
var app = express();
app.set('view engine', 'ejs');
app.use('/css', express.static('css'));
app.use('/images', express.static('images'));
var jsonParser = bodyParser.json();
var urlencodedParser = bodyParser.urlencoded({
  extended: false
});
var token, id;
app.get('/', function(req, res) {
  res.render('homepage.ejs');
  console.log('home template working');
});

app.get('/login', function(req, res) {
  res.render('login.ejs', {
    qs: req.query
  });
  console.log('login template working');
});
app.post('/login', urlencodedParser, function(req, res) {
  if (!req.body) return res.sendStatus(400);
  var body = JSON.stringify(req.body);
  console.log(body);
  var headers = {
    'Content-Type': 'application/json'
  };
  var options = {
    url: 'http://auth.vcap.me/login',
    method: 'POST',
    headers: headers,
    body: body
  };
  request(options, function(error, response, bod) {
    if (!error && response.statusCode == 200) {
      var bod1 = JSON.parse(bod);
      token = bod1.auth_token;
      id = bod1.hasura_id;
      res.redirect('/information');
    } else {
      //console.log(error+' '+response.statusCode);
    }
  });
});
app.get('/search-form', function(req, res) {
  res.send('This is search form');
});
app.get('/register', function(req, res) {
  res.render('register.ejs', {
    qs1: req.query
  });
  console.log('register template working');
});
app.post('/register', urlencodedParser, function(req, res) {
  if (!req.body) return res.sendStatus(400);
  //var body1=req.body;
  console.log(req.body);
  var body1 = req.body;
  var body = JSON.stringify({
    'username': req.body.name,
    'email': req.body.email,
    'password': req.body.password
  });
  console.log(body1);
  var headers = {
    'Content-Type': 'application/json'
  };
  var options = {
    url: 'http://auth.vcap.me/signup',
    method: 'POST',
    headers: headers,
    body: body
  };
  request(options, function(error, response, bod) {
    if (!error && response.statusCode == 200) {
      var bod1 = JSON.parse(bod);
      console.log(bod1.auth_token);
      token = bod1.auth_token;
      id = bod1.hasura_id;
      headers.Authorization = 'Bearer ' + token;
      body1.id = id;
      //options.url='http://data.vcap.me/v1/query';
      var body2 = {
        'type': 'insert',
        'args': {
          'table': "user_details",
          'objects': [{
            'id': body1.id,
            'name': body1.name,
            'email': body1.email,
            'phone': body1.phone
          }]
        }
      };
      body2 = JSON.stringify(body2);
      options = {
        url: 'http://data.vcap.me/v1/query',
        method: 'POST',
        headers: headers,
        body: body2
      };
      request(options, function(error, response, bod) {
        if (!error && response.statusCode == 200) {
          console.log(bod);
          res.redirect('/information');
        } else {
          console.log(error + ' in ' + response.statusCode);
        }
      });
    } else {
      console.log(error + ' out ' + response.statusCode);
    }
  });
});
app.get('/information', function(req, res) {
  res.render('information.ejs', {
    qs2: req.query
  });
  console.log('information template working'+token+' '+id);
});
app.post('/information', urlencodedParser, function(req, res) {
  if (!req.body) return res.sendStatus(400);
  var body = {
    'type': 'insert',
    'args': {
      'table': "pinfo",
      'objects': [{
        'id': id
      }],
      'returning' : ['pid']
    }
  };
  body=JSON.stringify(body);
  var headers = {
    'Content-Type': 'application/json',
    'Authorization' : 'Bearer ' + token
  };
  var options={
    url: 'http://data.vcap.me/v1/query',
    method: 'POST',
    headers: headers,
    body: body
  };
  var body1=req.body;
  console.log(body1);
  request(options, function(error, response, bod) {
    if (!error && response.statusCode == 200) {
      console.log(bod);
      //res.send('inserted');
      bod=JSON.parse(bod);
      var pid=bod.returning[0].pid;
      body = {
        'type': 'insert',
        'args': {
          'table': "addrinfo",
          'objects': [{
            'pid': pid,
            'hno':req.body.hno,
            'colname':req.body.cname,
            'locality':req.body.locality,
            'city':req.body.city,
            'pin':req.body.pin,
            'state': req.body.state
          }]
        }
      };
      body=JSON.stringify(body);
      console.log(body);
      options.body=body;
      request(options, function(error, response, bod) {
        if (!error && response.statusCode == 200) {
          //res.send('addrinfo suceesw');
          var body2 = {
            'type': 'insert',
            'args': {
              'table': "propinfo",
              'objects': [{
                'pid': pid,
                'bedroom':body1.bedroom,
                'kitchen':body1.kitchen,
                'bathroom':body1.bathroom,
                'garage':body1.garage,
                'floor':body1.floor,
                'rent': body1.rent,
                'deposit':body1.deposit,
                'elecbill':body1.elecbill
              }]
            }
          };
          body2=JSON.stringify(body2);
          console.log(body2);
          options.body=body2;
          request(options, function(error, response, bod) {
            if (!error && response.statusCode == 200) {
              //res.send('propinfo suceesw');
              var body3={
                'type': 'insert',
                'args': {
                  'table': "extrainfo",
                  'objects': [{
                    'pid': pid,
                    'title':body1.title,
                    'description':body1.desc
                  }]
                }
              };
              body3=JSON.stringify(body3);
              console.log(body3);
              options.body=body3;
              request(options, function(error, response, bod) {
                if (!error && response.statusCode == 200) {
                  console.log(bod);
                  res.send('information inserted');
                } else {
                  console.log(error + ' in ' + response.statusCode+' in extra');
                }
              });
            } else {
              console.log(error + ' in ' + response.statusCode+'  in propinfo');
            }
          });
        } else {
          console.log(error + ' in ' + response.statusCode+' in addr');
        }
      });

    } else {
      console.log(error + ' in ' + response.statusCode);
    }
  });
});
var port = 3000;
app.listen(3000, function() {
  console.log(`Rentpalace listening on port ${port}!`);
});
