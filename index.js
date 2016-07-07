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
      name: 'PassportAuth',
      type: 'service',
      param: 'Passport'
    },

    plugin: {
      load: function(inject, loaded) {
        var self = this;
        var strategyCount = 0;
        // Get files from configured work directory. Defaults to ./passport
        fs.readdirAsync(this.options.workDir)
          .then(function(files) {
            _.chain(files)
              .filter(function(file){
                var hidden = /^\..*/
                return !hidden.test(file)
              })
              .each(function(file) {
              var strategy = require(path.join(self.options.workDir, file));

              if(_.isFunction(strategy)) {
                // Pass the returned function through the dependency injector
                var injectedStrategy = inject(strategy);

                // Typecheck the object returned if it is a Strategy add it to Passport
                if(_.isFunction(injectedStrategy.authenticate)){
                  self.Logger.log('Adding ' + injectedStrategy.name + ' Strategy');
                  strategyCount += 1;
                  return Passport.use(injectedStrategy)
                }

                // If it an object containing serialization functions, add those to Passport.
                if(_.isFunction(injectedStrategy.serializeUser) && _.isFunction(injectedStrategy.deserializeUser)){
                  self.Logger.log('Adding Serialization functions.');
                  Passport.serializeUser(injectedStrategy.serializeUser);
                  Passport.deserializeUser(injectedStrategy.deserializeUser);
                }
              }
            }).value();
            self.Logger.log(strategyCount + ' Strategies added.');
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