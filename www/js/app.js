// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'ionic
// 'starter.controllers' is found in controllers.js


angular.module('starter', ['ionic', 'firebase', 'journey.controllers', 'journey.services', 'ngMap', 'journey.directives', 'ngStorage', 'ngCordova'])

  .run(function ($ionicPlatform, $firebaseAuth, $state, $localStorage) {
    $ionicPlatform.ready(function () {
      // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
      // for form inputs)
      if (window.cordova && window.cordova.plugins.Keyboard) {
        cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
        cordova.plugins.Keyboard.disableScroll(true);

      }
      if (window.StatusBar) {
        // org.apache.cordova.statusbar required
        StatusBar.styleDefault();
      }

      //Removed. Add for production bitch

      /*if($localStorage.storageAuth) {
       console.log($localStorage.storageAuth.token);
       var token = $localStorage.storageAuth.token;

       var ref = new Firebase('https://journeyapp91.firebaseio.com/');

       var auth = $firebaseAuth(ref);

       auth.$authWithCustomToken(token, function(error, authData) {
       if (error) {
       console.log("Authentication Failed!", error);
       } else {
       console.log("Authenticated successfully with payload:", authData);
       }
       }).then(function(authData) {
       $state.go('tab.feed');
       return true;
       }).catch(function(error) {
       console.log("Please sign in", error);
       delete $localStorage.storageAuth;
       });

       } else {
       $state.go('user.signin');
       console.log('not logged in');
       }*/

      cordova.plugins.backgroundMode.setDefaults({ text:'Live Recording in Progress'});

      cordova.plugins.backgroundMode.onactivate = function () {
        console.log('background mode activated');
        };





    });
  })

  .config(function ($stateProvider, $urlRouterProvider) {
    $stateProvider

      .state('user', {
        url: '/user',
        abstract: true,
        templateUrl: 'templates/user.html'
      })
      //maintained separate states in user login in case of including an email register page
      .state('user.signin', {
        url: '/signin',
        views: {
          tabLogin: {
            controller: 'AuthCtrl',
            controllerAs: 'authCtrl',
            templateUrl: 'templates/user.signin.html'
          }
        },
        resolve: {
          auth: function ($state, Auth, $localStorage, User, $timeout) {
            if ($localStorage.storageAuth) {

              User.setUser($localStorage.storageAuth);
              console.log('User existing in Local Storage: ' + $localStorage.storageAuth.token);

              $timeout(function() {
                $state.go('tab.feed');
              });

            };
          }
        },

      })

      .state('tab', {
        url: '/tab',
        abstract: true,
        templateUrl: 'templates/tabs.html',
        controller: 'TabsCtrl'
      })

      .state('tab.search', {
        url: '/search',
        views: {
          'menuContent': {
            templateUrl: 'templates/search.html'
          }
        }
      })

      .state('tab.feed', {
        url: '/feed',
        resolve: {
          auth: function ($state, Auth, $localStorage) {
            if ($localStorage.storageAuth) {
              console.log('User existing in Local Storage from feed: ' + $localStorage.storageAuth.token);
            } else {
              return Auth.$requireAuth().catch(function () {
                console.log("Auth.$requireAuth() did not fulfill.");
                $state.go('user.signin');
              });
            };
          },
/*
           //Removed for offline functionality 2016-05-15 (Entries for feedfire)
           entries: function(feedFire){
           console.log('feedFire Array' + feedFire.feedArray().$loaded());
           return feedFire.feedArray().$loaded();
           }*/

          offline: function($rootScope, $localStorage) {
            if ($localStorage.offline === false) {
              console.log('should be in online mode');
              $rootScope.offline = {
                value: $localStorage.offline
              }
            } else {
              console.log('should be in offline mode');
              $rootScope.offline= {
                value: $localStorage.offline
              }
            };
          }


        },
        views: {
          'tab-feed': {
            templateUrl: 'templates/feed.html',
            controller: 'feedCtrl'
          }
        },

      })

      .state('tab.journey', {
        url: '/journey',
        views: {
          'tab-journey': {
            templateUrl: 'templates/journey.html',
            controller: 'journeyCtrl'
          }
        }
      })

      .state('tab.submit', {
        url: '/submit',
        views: {
          'tab-journey': {
            templateUrl: 'templates/journeysubmit.html',
            controller: 'submitCtrl'
          }
        },
        resolve: {
          url: function (captureService) {
            return console.log('app.js: ' + captureService.url);
          }

        }
      })

      .state('tab.experiences', {
        url: '/experiences',
        views: {
          'tab-experiences': {
            templateUrl: 'templates/experiences.html',
            controller: 'experiencesCtrl'
          }
        }
      })

      .state('tab.bulkLoader', {
        url: '/bulkLoader',
        views: {
          'tab-journey': {
            templateUrl: 'templates/bulkLoader.html',
            controller: 'bulkLoader'
          }
        }
      })

      .state('tab.continuous', {
        url: '/continuous',
        views: {
          'tab-journey': {
            templateUrl: 'templates/continuous.html',
            controller: 'continuousCtrl'
          }
        }
      })

      .state('tab.experience', {
        url: '/experiences/:key',
        resolve: {
          entries: function (journeyFire, $stateParams, experienceService, $localStorage, $rootScope) {
            if ($stateParams.key == 1 || $stateParams.key == 2) {
              console.log('hello');
              return experienceService.results;
            } else {
              if ($rootScope.offline.value === false) {
                console.log('journeyFire Array' + journeyFire.journeyArray($stateParams.key).$loaded());
                return journeyFire.journeyArray($stateParams.key).$loaded();
              } else {
                console.log('balls');
                return $localStorage[$stateParams.key];
              }

            }

          }
        },
        views: {
          'tab-experiences': {
            templateUrl: 'templates/experience.html',
            controller: 'experienceCtrl'
          }
        },
        onExit: function () {
          console.log('state exited');
        }
      })

      .state('tab.contribute', {
        url: '/contribute',
        views: {
          'tab-contribute': {
            templateUrl: 'templates/contribute.html',
            controller: 'contributeCtrl'
          }
        }

      })


      .state('tab.single', {
        url: '/playlists/:playlistId',
        views: {
          'tab-playlists': {
            templateUrl: 'templates/playlist.html',
            controller: 'PlaylistCtrl'
          }
        }
      });
    // if none of the above states are matched, use this as the fallback
    $urlRouterProvider.otherwise('/user/signin');
  })

  .constant('FirebaseUrl', 'https://journeyapp91.firebaseio.com/')
  .constant('weatherApiKey', 'df9e7b9c2a0b11883700db6a6add4dc1');

