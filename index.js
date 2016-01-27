/**
 * @file index
 * @author Jim Bulkowski <jim.b@paperelectron.com>
 * @project Pomegranate-passport
 * @license MIT {@link http://opensource.org/licenses/MIT}
 */

'use strict';

var Passport = require('passport');
var Promise = require('bluebird');
var fs = Promise.promisifyAll(require('fs'));
var path = require('path');
var _ = require('lodash');
/**
 *
 * @module index
 */

module.exports = [
  {
    options: {
      workDir: './passport'
    },

    metadata: {
      name: 'Passport',
      type: 'service',
      layer: 'dependency',
      param: 'Passport'
    },

    plugin: {
      load: function(inject, loaded) {
        var self = this
        fs.readdirAsync(this.options.workDir)
          .then(function(files) {
            _.each(files, function(file) {
              var strategy = require(path.join(self.options.workDir, file));

              if(_.isFunction(strategy)) {
                var injectedStrategy = inject(strategy);
                return Passport.use(injectedStrategy)
              }

            });

            loaded(null, Passport)
          })
          .catch(function(err){
            return loaded(err, null)
          })

      },
      start: function(done) {
        done()
      },
      stop: function(done) {
        done()
      }
    }
  },
  {
    options: {
      format: 'express'
    },
    metadata: {
      name: 'PassportMiddleware',
      type: 'merge',
      layer: 'dependency',
      param: 'Middleware'
    },
    plugin: {
      load: function(inject, loaded) {
        var PassPortMiddlewares = {
          passportInitialize: function(req, res, next) {
            return Passport.initialize()(req, res, next)
          },
          passportSession: function(req, res, next) {
            return Passport.session()(req, res, next)
          }
        }

        loaded(null, PassPortMiddlewares)
      },
      start: function(done) {
        done()
      },
      stop: function(done) {
        done()
      }
    }
  }
]