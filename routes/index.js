var express = require('express');
var router = express.Router();
var request = require('request');
var config = require('../config');

router.get('/', function(req, res) {
  res.setLocale(config.locale);
  res.render('index', { community: config.community,
                        tokenRequired: !!config.inviteToken });
});

router.post('/invite', function(req, res) {
  if (req.body.email && (!config.inviteToken || (!!config.inviteToken && req.body.token === config.inviteToken))) {
    request.post({
        url: 'https://'+ config.slackUrl + '/api/users.admin.invite',
        form: {
          email: req.body.email,
          token: config.slacktoken,
          set_active: true
        }
      }, function(err, httpResponse, body) {
        // body looks like:
        //   {"ok":true}
        //       or
        //   {"ok":false,"error":"already_invited"}
        if (err) { return res.send('Erreur :' + err); }
        body = JSON.parse(body);
        if (body.ok) {
          res.render('result', {
            community: config.community,
            message: 'C\'est fait. Va vérifier "'+ req.body.email +'" pour confirmer l\'inscription.'
          });
        } else {
          var error = body.error;
          if (error === 'already_invited' || error === 'already_in_team') {
            res.render('result', {
              community: config.community,
              message: 'Tu es déjà inscrit(e)<br>' +
                       'Va sur <a href="https://'+ config.slackUrl +'">'+ config.community +'</a>'
            });
            return;
          } else if (error === 'invalid_email') {
            error = 'Email invalide.';
          } else if (error === 'invalid_auth') {
            error = 'Un souci technique, contacte moi sur cedric.bazureau@lebeaujeu.com pour plus d\'information.';
          }

          res.render('result', {
            community: config.community,
            message: 'Déso ! ' + error,
            isFailed: true
          });
        }
      });
  } else {
    var errMsg = [];
    if (!req.body.email) {
      errMsg.push('Email obligatoire');
    }

    if (!!config.inviteToken) {
      if (!req.body.token) {
        errMsg.push('Jeton d\'invitation obligatoire');
      }

      if (req.body.token && req.body.token !== config.inviteToken) {
        errMsg.push('Mauvais jeton');
      }
    }

    res.render('result', {
      community: config.community,
      message: 'Déso ! ' + errMsg.join(' et ') + '.',
      isFailed: true
    });
  }
});

module.exports = router;
