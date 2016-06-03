angular.module('journey.controllers', ['journey.services'])

  .controller('AppCtrl', function ($scope, $ionicModal, $timeout) {

    // With the new view caching in Ionic, Controllers are only called
    // when they are recreated or on app start, instead of every page change.
    // To listen for when this page is active (for example, to refresh data),
    // listen for the $ionicView.enter event:
    //$scope.$on('$ionicView.enter', function(e) {
    //});

    // Form data for the login modal
    $scope.loginData = {};

    // Create the login modal that we will use later
    $ionicModal.fromTemplateUrl('templates/login.html', {
      scope: $scope
    }).then(function (modal) {
      $scope.modal = modal;
    });

    // Triggered in the login modal to close it
    $scope.closeLogin = function () {
      $scope.modal.hide();
    };

    // Open the login modal
    $scope.login = function () {
      $scope.modal.show();
    };

    // Perform the login action when the user submits the login form
    $scope.doLogin = function () {
      console.log('Doing login', $scope.loginData);

      // Simulate a login delay. Remove this and replace with your login
      // code if using a login system
      $timeout(function () {
        $scope.closeLogin();
      }, 1000);
    };
  })

  .controller('AuthCtrl', function ($state, Auth, $firebaseAuth, User, $localStorage, $q, $timeout) {
    var authCtrl = this;
    authCtrl.login = function () {

      //This section has been added as a result of not being able to automatically rediret to login from the  resolve... (if statement)
      if ($localStorage.storageAuth) {

        User.setUser($localStorage.storageAuth);

        console.log('Logged in via button with: ' + $localStorage.storageAuth.token);
        $state.go('tab.feed');
      } else {
        Auth.$authWithOAuthPopup('facebook').then(function (authData) {
          //Save user data into User Service
          if (authData && !User.isNewUser(authData.uid)) {
            User.createUser(authData);
          }
          User.setUser(authData);
          $localStorage.storageAuth = User.profile;

          console.log('success!', authData, 'local Storage: ', $localStorage.storageAuth, 'User information: ', User.profile);


          $state.go('tab.feed');

        }).catch(function (error) {
          if (error) {
            if (error.code === "TRANSPORT_UNAVAILABLE") {
              // fall-back to browser redirects, and pick up the session
              // automatically when we come back to the origin page
              Auth.$authWithOAuthRedirect("facebook").then(function (authData) {
                $state.go('tab.feed');
              }.catch(function (error) {
                console.log(error);
              }));
            }
          }
        });
      }


    };


  })

  .controller('journeyCtrl', ['$scope', '$ionicPlatform', '$interval', 'manualCaptureService', 'geolocationService', '$cordovaFileTransfer', 'Amazon', '$ionicLoading', '$state', 'captureService', function ($scope, $ionicPlatform, $interval, manualCaptureService, geolocationService, $cordovaFileTransfer, Amazon, $ionicLoading, $state, captureService) {

    $ionicPlatform.ready(function () {
      $scope.captureMode = false;
      var videoSuccess = function (mediaFiles) {
        var i, path, len;
        for (i = 0, len = mediaFiles.length; i < len; i += 1) {
          path = mediaFiles[i].fullPath;
          /*path = path.replace("file:", "");*/
          path = path.replace("file:/", "file:///");
          console.log(' this is the returned path: ' + path);
          captureService.mimeType = 'video/mp4';
          captureService.url = path;
          $state.go('tab.submit')
        }
      };

      var audioSuccess = function (mediaFiles) {
        var i, path, len;
        for (i = 0, len = mediaFiles.length; i < len; i += 1) {
          var audioPath = mediaFiles[i].fullPath;
          audioPath = audioPath.replace("%:", "/");
          /*path = path.replace("file:/", "file:///");*/
          console.log(' this is the returned path: ' + audioPath);
          captureService.mimeType = 'audio/mp4';
          /*          captureServiscope.urlce.url = path.replace('%', "/");*/
          captureService.url = audioPath;
          console.log('this is the new returned path' + captureService.url)
          $state.go('tab.submit');
        }
      };

      var captureError = function (error) {
        console.debug("Unable to capture: " + error, "app");
      };

      // capture error callback
      var captureError = function (error) {
        navigator.notification.alert('Error code: ' + error.code, null, 'Capture Error');
      };

      $scope.cameraCapture = function () {
        var options = {
          quality: 50,
          destinationType: Camera.DestinationType.FILE_URI,
          sourceType: Camera.PictureSourceType.CAMERA,
          allowEdit: false,
          encodingType: Camera.EncodingType.JPEG,
          correctOrientation: true,
          popoverOptions: CameraPopoverOptions,
          saveToPhotoAlbum: true
        };

        navigator.camera.getPicture(function cameraSuccess(imageUri) {
          console.log(imageUri);
          captureService.url = imageUri;
          captureService.mimeType = 'image/jpg';
          $state.go('tab.submit');
        }, function cameraError(error) {
          console.debug("Unable to obtain picture: " + error, "app");
        }, options);
      };

      $scope.audioCapture = function () {
        navigator.device.capture.captureAudio(audioSuccess, captureError, {duration: 1});
      };

      $scope.videoCapture = function () {
        navigator.device.capture.captureVideo(videoSuccess, captureError, {duration: 5});
      };
    });

    $scope.broadcast = function () {
      $state.go('tab.continuous');

    };

    $scope.click = function () {
      captureService.url = 'https://s3.amazonaws.com/uifaces/faces/twitter/brynn/128.jpg';
      $state.go('tab.submit')

    };

  }])

  .controller('bulkLoader', ['$scope', '$rootScope', '$localStorage', 'fireLoader', 'amaLoader', 'FirebaseUrl', 'Amazon', 'User', '$cordovaFileTransfer', '$ionicLoading', 'weatherApi', function ($scope, $rootScope, $localStorage, fireLoader, amaLoader, FirebaseUrl, Amazon, User, $cordovaFileTransfer, $ionicLoading, weatherApi) {
    $scope.offlineExp = $localStorage.experiences;

    $scope.bulkLoad = function (id) {
      console.log('This is the collection ID/TimeStamp: ' + id);

      var titleInfo = $localStorage.experiences[id];
      var filename = encodeURI($localStorage.experiences[id].imageUrl.replace(/^.*[\\\/]/, ''));

      console.log('This it the title page information: ' + titleInfo);
      console.log($localStorage.experiences[id]);

      //This is all for the title uploading copied from submitCtrl
      var info1 = $localStorage.experiences[id];
      var ref = new Firebase(FirebaseUrl);
      var newJourneyRef = ref.child("journeyfire").push();
      var newJourneyKey = newJourneyRef.key();
      var amazonParams = Amazon.upload($localStorage.experiences[id].imageUrl, $localStorage.experiences[id].mimeType, User.profile.lid, newJourneyKey);

      var pastWeather1 = function () {
        return weatherApi.getPastWeather(info1.lat, info1.lon, info1.timeStamp);
      }

      pastWeather1().then(function (resp) {
        console.log(resp);
        info1.weather = resp.data.currently.icon;
        info1.temp = resp.data.currently.temperature;
        console.log('this is info1: ' + info1);
        fireLoader.uploadNew(info1, newJourneyRef, newJourneyKey, filename);

        return $cordovaFileTransfer.upload("https://journeyapp.s3.amazonaws.com/", $localStorage.experiences[id].imageUrl, amazonParams.Uoptions, $localStorage.experiences[id].title);


      }).then(function (result) {
        // Success!
        // Let the user know the upload is completed
        $ionicLoading.show({template: 'Upload Success!', duration: 3000});
        console.log('upload to s3 succeed ', result);

      }, function (err) {
        // Error
        // Uh oh!
        $ionicLoading.show({template: 'Upload Failed', duration: 3000});
        console.log('upload to s3 fail ', err);
      }, function (progress) {

        // constant progress updates
      });


      //2 This is the crazy loop, who knows what will happen

      var entries = $localStorage[id];
      //redundant shitty code.
      var parentKey = newJourneyKey;

      function updateEntries(entries, i) {
        if (i < entries.length) {

          var info2 = entries[i];
          var filename2 = encodeURI(entries[i].imageUrl.replace(/^.*[\\\/]/, ''));
          var url2 = entries[i].imageUrl;
          var amazonParams2 = Amazon.upload(url2, entries[i].mimeType, User.profile.lid, parentKey);
          console.log(amazonParams);

          var pastWeather2 = function () {
            return weatherApi.getPastWeather(info2.lat, info2.lon, info2.timeStamp);
          }

          pastWeather1().then(function (resp) {
            console.log(resp);
            info2.weather = resp.data.currently.icon;
            info2.temp = resp.data.currently.temperature;
            console.log('this is info2: ' + info2);
            fireLoader.upload(info2, parentKey, filename2)

            return $cordovaFileTransfer.upload("https://journeyapp.s3.amazonaws.com/", url2, amazonParams2.Uoptions, entries[i].title)

          }).then(function (result) {
            // Success!
            // Let the user know the upload is completed
            $ionicLoading.show({template: 'Upload Success!' + i, duration: 3000});
            console.log('upload to s3 succeed ' + i, result);
            return updateEntries(entries, i + 1);

          }, function (err) {
            // Error
            // Uh oh!
            $ionicLoading.show({template: 'Upload Failed', duration: 3000});
            console.log('upload to s3 fail ', err);
          }, function (progress) {

            // constant progress updates
          });
        }
      }

      updateEntries(entries, 0);
    }
  }])

  .controller('continuousCtrl', ['$scope', 'captureService', 'experiencesService', 'Amazon', 'User', '$state', 'FirebaseUrl', '$timeout', '$cordovaGeolocation', 'weatherApi', '$firebaseArray', '$rootScope', 'fireLoader', 'amaLoader', '$localStorage', '$ionicPlatform', '$interval', '$ionicLoading', function ($scope, captureService, experiencesService, Amazon, User, $state, FirebaseUrl, $timeout, $cordovaGeolocation, weatherApi, $firebaseArray, $rootScope, fireLoader, amaLoader, $localStorage, $ionicPlatform, $interval, $ionicLoading) {

    $ionicPlatform.ready(function () {


      $scope.profile = 'facebook:10154035067882095';
      if ($rootScope.offline.value === false) {
        $scope.experiences = {};
        var journeyFireRef = new Firebase(FirebaseUrl + 'journeyfire');

        var indexRef = new Firebase(FirebaseUrl + 'user_meta/').child($scope.profile);

        $scope.experiences = $firebaseArray(indexRef);
      } else {
        $scope.offlineExp = $localStorage.experiences;
      };

      $scope.likes = 2;
      $scope.timeStamp = new Date();
      $scope.timeStamp = Math.round($scope.timeStamp.getTime()/1000);
      console.log('this is the time Stamp: ' + $scope.timeStamp);
      $scope.journey = {};
      $scope.journey.title = '';
      $scope.journey.description = '';
      var url = '';
      var mimeType = 'image/jpeg';
      $scope.key = '';

      $scope.interval = {};
      $scope.interval.int = 10;
      $scope.options = {
        name: "Image",
        dirName: "CameraPictureBackground",
        orientation: "portrait",
        type: 'back'
      };
      var posOptions = {timeout: 5000, enableHighAccuracy: true};

      //Geolocation things
      $cordovaGeolocation.getCurrentPosition(posOptions).then(function (position) {
        $scope.lat = position.coords.latitude;
        $scope.lon = position.coords.longitude;
        $scope.current = {};
        $scope.current.currently = {};
        $scope.current.currently.icon = '';
        $scope.current.currently.temperature = '';

        if ($rootScope.offline.value === true) {
          return

        } else {
          return weatherApi.getCurrentWeather($scope.lat, $scope.lon);
        }


      }, function (err) {
        console.log(err);
        // error
      }).then(function (resp) {
        if ($rootScope.offline.value === true) {
          return
        } else {
          $scope.current = resp.data;
          console.log($scope.current);
        }

      }, function (err) {
        console.log(err);
      });

      var update = function (parentKey, filename, imageUrl) {
        var filename = filename;
        var info = {
          title: $scope.journey.title,
          description: $scope.journey.description,
          timeStamp: $scope.timeStamp,
          lat: $scope.lat,
          lon: $scope.lon,
          imageUrl: imageUrl,
          user: User.profile.displayName,
          userImg: User.profile.profileUrl,
          likes: $scope.likes,
          weather: $scope.current.currently.icon,
          temp: $scope.current.currently.temperature,
          mimeType: 'image/jpeg',
          live: true
        };

        if ($rootScope.offline.value === true) {
          var timeStamp = parentKey;
          $localStorage[timeStamp].push(info);
          console.log($localStorage[timeStamp]);

          $ionicLoading.show({template: 'Upload Success!', duration: 3000});

        } else {
          var parentKey = parentKey;

          fireLoader.upload(info, parentKey, filename);

          var amazonParams = Amazon.upload(imageUrl, mimeType, User.profile.lid, parentKey);
          console.log(amazonParams);
          amaLoader.upload(imageUrl, amazonParams.Uoptions, $scope.title);
        }

      };

      var successCall = function(imageUrl) {
        console.log('imageURL: ' + imageUrl);

        //May require for Image Url
        /*path = path.replace("file:", "")*/
        var filename = encodeURI(imageUrl.replace(/^.*[\\\/]/, ''));

        update($scope.key, filename, imageUrl);

      };

      var camera = function () {
        console.log('Camera Function Fired');

        window.plugins.CameraPictureBackground.takePicture(successCall, function (error) {
          console.log(error);
        }, $scope.options);
      };

      $scope.broadcast = function (key) {
        cordova.plugins.backgroundMode.enable();
        window.powerManagement.dim(function() {
          console.log('Wakelock acquired');
        }, function() {
          console.log('Failed to acquire wakelock');
        });
        window.powerManagement.setReleaseOnPause(false, function() {
          console.log('Set successfully');
        }, function() {
          console.log('Failed to set');
        });
        console.log('shots fired');
        $scope.key = key;

        $interval(function () {
          $cordovaGeolocation.getCurrentPosition(posOptions).then(function (position) {
            $scope.lat = position.coords.latitude;
            $scope.lon = position.coords.longitude;
            console.log('location received!');
            console.log(position);

            if ($rootScope.offline.value === true) {
              return
            } else {
              console.log('trying to get weather api')
              return weatherApi.getCurrentWeather($scope.lat, $scope.lon);
            }

          }, function (err) {
            console.log(err);
            // error
          }).then(function (resp) {
            console.log('got into here');
            if ($rootScope.offline.value === false) {
              $scope.current = resp.data;
              console.log($scope.current);
            };

            $scope.timeStamp = new Date();
            $scope.timeStamp = Math.round($scope.timeStamp.getTime()/1000);
            console.log('this is the time Stamp: ' + $scope.timeStamp);
                        //Fire Camera
            camera();

          }, function (err) {
            console.log(err);
          });

         }, 15000);

        //$scope.interval.int*60000
      }
    });

    $scope.test = function () {
      console.log($scope.options);
      console.log($scope.interval);
    }





  }])


  .controller('submitCtrl', ['$scope', 'captureService', 'experiencesService', 'Amazon', 'User', '$state', 'FirebaseUrl', '$timeout', '$cordovaGeolocation', 'weatherApi', '$firebaseArray', '$rootScope', 'fireLoader', 'amaLoader', '$localStorage', function ($scope, captureService, experiencesService, Amazon, User, $state, FirebaseUrl, $timeout, $cordovaGeolocation, weatherApi, $firebaseArray, $rootScope, fireLoader, amaLoader, $localStorage) {

    $scope.profile = 'facebook:10154035067882095';
    $scope.lat = "";
    $scope.lon = "";
    $scope.likes = 2;
    $scope.timeStamp = new Date();
    $scope.timeStamp = Math.round($scope.timeStamp.getTime()/1000);
    console.log('this is the timestamp: ');
    console.log($scope.timeStamp);

    var posOptions = {timeout: 5000, enableHighAccuracy: true};

    $cordovaGeolocation.getCurrentPosition(posOptions).then(function (position) {
      $scope.lat = position.coords.latitude;
      $scope.lon = position.coords.longitude;
      $scope.current = {};
      $scope.current.currently = {};
      $scope.current.currently.icon = '';
      $scope.current.currently.temperature = '';

      if ($rootScope.offline.value === false) {
        return weatherApi.getCurrentWeather($scope.lat, $scope.lon);
      }

    }, function (err) {
      console.log(err);
      // error
    }).then(function (resp) {
      $scope.current = resp.data;
      console.log($scope.current);
    }, function (err) {
      console.log(err);
    });

    $scope.mimeType = captureService.mimeType;
    $scope.url = captureService.url;

    $scope.picker = experiencesService.experiences;

    $scope.toggle = function () {
      if ($scope.new === true) {
        $scope.new = false;
      } else {
        $scope.new = true;
      }
      ;
    }
    $scope.journey = {};
    $scope.journey.title = '';
    $scope.journey.description = '';
    var filename = encodeURI($scope.url.replace(/^.*[\\\/]/, '').replace(/\.[^/.]+$/, ""));

    if ($rootScope.offline.value === false) {
      $scope.experiences = {};
      var journeyFireRef = new Firebase(FirebaseUrl + 'journeyfire');

      var indexRef = new Firebase(FirebaseUrl + 'user_meta/').child($scope.profile);

      $scope.experiences = $firebaseArray(indexRef);
    } else {
      //Insert offline else statements here.
    }

    $scope.offline = $localStorage.experiences;
    console.log($localStorage.experiences);

    /*  // fetch the user's book list dynamically because it may change in real-time
     var indexRef = new Firebase(FirebaseUrl + 'user_meta/').child($scope.profile);

     // watch the index for add events
     indexRef.on('child_added', function (indexSnap) {
     console.log('child added');
     // fetch the book and put it into our list
     var expId = indexSnap.key();

     console.log('Id: ' + expId);

     journeyFireRef.child(expId).on('value', function (experienceSnap) {
     // trigger $digest/$apply so Angular syncs the DOM
     $timeout(function () {
     if (experienceSnap.val() === null) {
     // the book was deleted
     delete $scope.experiences[expId];
     console.log('deleted');
     }
     else {
     $scope.experiences[expId] = experienceSnap.val();
     console.log('called');
     }
     });
     });
     });

     // watch the index for remove events
     indexRef.on('child_removed', function (snap) {
     // trigger $digest/$apply so Angular updates the DOM
     // trigger $digest/$apply so Angular updates the DOM
     $timeout(function (snap) {
     delete $scope.experiences[snap.key()];
     });
     });*/


    $scope.update = function (parentKey) {
      var info = {
        title: $scope.journey.title,
        description: $scope.journey.description,
        timeStamp: $scope.timeStamp,
        lat: $scope.lat,
        lon: $scope.lon,
        imageUrl: $scope.url,
        user: User.profile.displayName,
        userImg: User.profile.profileUrl,
        likes: $scope.likes,
        weather: $scope.current.currently.icon,
        temp: $scope.current.currently.temperature,
        mimeType: $scope.mimeType,
        live: false,
        type: 'update',
        filename: filename
      };

      if ($rootScope.offline.value === true) {
        var timeStamp = parentKey;
        $localStorage[timeStamp].push(info);
        console.log($localStorage[timeStamp])
        $state.go('tab.journey');

      } else {
        var parentKey = parentKey;

        fireLoader.upload(info, parentKey, filename);

        var amazonParams = Amazon.upload($scope.url, $scope.mimeType, User.profile.lid, parentKey);
        //May not be required anymore
        console.log(amazonParams);

        //new provision for new upload V1.0
        amaLoader.upload($scope.url, amazonParams.Uoptions, info, User.profile.lid, parentKey);
      }

    };

    $scope.uploadNew = function () {
      var info = {
        title: $scope.journey.title,
        description: $scope.journey.description,
        timeStamp: $scope.timeStamp,
        //This isn't actually carried through to anywhere. Should actually be removed
        imageUrl: $scope.url,
        lat: $scope.lat,
        lon: $scope.lon,
        user: User.profile.displayName,
        userImg: User.profile.profileUrl,
        likes: $scope.likes,
        weather: $scope.current.currently.icon,
        temp: $scope.current.currently.temperature,
        mimeType: $scope.mimeType,
        live: false,
        type: 'new',
        filename: filename
      };

      if ($rootScope.offline.value === true) {

        if ($localStorage.experiences) {
          console.log(info.timeStamp);

          $localStorage.experiences[info.timeStamp] = info
          $localStorage[info.timeStamp] = [];
          $localStorage[info.timeStamp].push(info);
          console.log($localStorage[info.timeStamp]);

          $state.go('tab.journey');

        } else {
          $localStorage.experiences = {};
          $localStorage.experiences[info.timeStamp] = info
          $localStorage[info.timeStamp] = [];
          $localStorage[info.timeStamp].push(info);
          $state.go('tab.journey');
        }


      } else {
        //Have generation of newJourneyKey outside of fireLoader because it is used in identifying path for AmazonLoader
        //Initiate save to journeyFire
        var ref = new Firebase(FirebaseUrl);

        //Generate pushID for new journey
        var newJourneyRef = ref.child("journeyfire").push();
        var newJourneyKey = newJourneyRef.key();

        fireLoader.uploadNew(info, newJourneyRef, newJourneyKey, filename);

        var amazonParams = Amazon.upload($scope.url, $scope.mimeType, User.profile.lid, newJourneyKey);
        console.log(amazonParams);
        //url, parameters, title
        amaLoader.upload($scope.url, amazonParams.Uoptions, info, User.profile.lid, newJourneyKey);

      }


    };
  }])


  .controller('PlaylistCtrl', function ($scope, $stateParams) {
  })

  .controller('TabsCtrl', function ($scope, $ionicSideMenuDelegate, User, $state, $localStorage, $rootScope, $timeout) {

    $scope.displayName = $localStorage.storageAuth.displayName;
    $scope.profileUrl = $localStorage.storageAuth.profileUrl;
    $scope.connectToggle = function () {
      $timeout(function () {
        $localStorage.offline = $rootScope.offline.value;
        console.log("Offline Mode is set to: (localstorage & rtscope) " + $localStorage.offline + $rootScope.offline.value);
      })
    };

    $scope.logout = function () {
      console.log($localStorage.storageAuth);
      delete $localStorage.storageAuth;
      console.log('logout fired!');
      console.log($localStorage.storageAuth);
      $state.go('user.signin');
    };


    $scope.openMenu = function () {
      $ionicSideMenuDelegate.toggleLeft();
    }
  })

  .controller('experiencesCtrl', function ($scope, experiencesService, userMetaFire, User, $firebaseArray, FirebaseUrl, $timeout, $rootScope, $localStorage) {
    $scope.list = experiencesService.experiences;
    $scope.profile = 'facebook:10154035067882095';


    if ($rootScope.offline.value === true) {
      $scope.offlineExp = $localStorage.experiences;


    } else {
      $scope.experiences = {};
      var journeyFireRef = new Firebase(FirebaseUrl + 'journeyfire');

      // fetch the user's book list dynamically because it may change in real-time
      var indexRef = new Firebase(FirebaseUrl + 'user_meta/').child($scope.profile);

      $scope.experiences = $firebaseArray(indexRef);
    }


    //Kept as reference. Do not use in production version
    /* // watch the index for add events
     indexRef.on('child_added', function (indexSnap) {
     console.log('child added');
     // fetch the book and put it into our list
     var expId = indexSnap.key();

     console.log('Id: ' + expId);

     journeyFireRef.child(expId).on('value', function (experienceSnap) {
     // trigger $digest/$apply so Angular syncs the DOM
     $timeout(function () {
     if (experienceSnap.val() === null) {
     // the book was deleted
     delete $scope.experiences[expId];
     console.log('deleted');
     }
     else {
     $scope.experiences[expId] = experienceSnap.val();
     console.log('called');
     }
     });
     });
     });

     // watch the index for remove events
     indexRef.on('child_removed', function (snap) {
     // trigger $digest/$apply so Angular updates the DOM
     $timeout(function (snap) {
     delete $scope.experiences[snap.key()];
     });
     });

     */
  })

  .controller('experienceCtrl', function ($scope, experienceService, $ionicModal, $ionicSlideBoxDelegate, $timeout, $ionicScrollDelegate, mapService, $filter, $ionicPopup, slideInfo, $stateParams, journeyFire, entries, $sce) {

    //mapService things
    $scope.markerRed = mapService.markerRed;
    $scope.markerGreen = mapService.markerGreen;
    $scope.entries = entries;
    console.log('entries' + $scope.entries);

    $scope.lat = $scope.entries[0].lat;
    $scope.lon = $scope.entries[0].lon;

    console.log(entries);

    $scope.current = null;
    $scope.liked = true;

    /*var resultsLength = $scope.experience.results.length;*/
    var resultsLength = $scope.entries.length;
    console.log('resultsLength: ' + resultsLength);

    $scope.options = {
      loop: false,
      spaceBetween: 5,
      preloadImages: false,
      lazyLoading: true,
      lazyLoadingInPrevNext: true,
      nextButton: '.swiper-button-next',
      prevButton: '.swiper-button-prev',
      paginationHide: true
    }

    $scope.data = {};
    $scope.$watch('data.slider', function (nv, ov) {
      $scope.slider = $scope.data.slider;

      $scope.slider.on('onSlideNextStart', function () {
        console.log($scope.slider.activeIndex);

        $timeout(function () {
          if (document.getElementById("video" + String($scope.slider.activeIndex))) {
            var newVideo = document.getElementById("video" + String($scope.slider.activeIndex));
            newVideo.play();
          }
          ;
          if (document.getElementById("video" + String($scope.slider.activeIndex - 1))) {
            var oldVideo = document.getElementById("video" + String($scope.slider.activeIndex - 1));
            oldVideo.pause();
          }
          ;

          if (document.getElementById("audio" + String($scope.slider.activeIndex))) {
            var newAudio = document.getElementById("audio" + String($scope.slider.activeIndex));
            console.log('this is the index used for Audio: ' + $scope.slider.activeIndex);
            newAudio.play();
          }
          ;
          if (document.getElementById("audio" + String($scope.slider.activeIndex - 1))) {
            var newAudio = document.getElementById("audio" + String($scope.slider.activeIndex - 1));
            newAudio.pause();
          }
          ;

          if ($scope.slider.activeIndex === resultsLength + 1) {
            $scope.lat = $scope.entries[0].lat
            $scope.lon = $scope.entries[0].lon;
          } else {
            $scope.lat = $scope.entries[$scope.slider.activeIndex].lat
            $scope.lon = $scope.entries[$scope.slider.activeIndex].lon;
          }
        });
      });

      $scope.slider.on('onSlidePrevStart', function () {
        console.log($scope.slider.activeIndex);
        $timeout(function () {

          if (document.getElementById("video" + String($scope.slider.activeIndex))) {
            var newVideo = document.getElementById("video" + String($scope.slider.activeIndex));
            newVideo.play();
          }
          ;
          if (document.getElementById("video" + String($scope.slider.activeIndex + 1))) {
            var oldVideo = document.getElementById("video" + String($scope.slider.activeIndex + 1));
            oldVideo.pause();
          }
          ;

          if (document.getElementById("audio" + String($scope.slider.activeIndex))) {
            var newAudio = document.getElementById("audio" + String($scope.slider.activeIndex));
            newAudio.play();
          }
          ;
          if (document.getElementById("audio" + String($scope.slider.activeIndex + 1))) {
            var newAudio = document.getElementById("audio" + String($scope.slider.activeIndex + 1));
            newAudio.pause();
          }
          ;

          if ($scope.slider.activeIndex === 0) {
            $scope.lat = $scope.entries[0].lat
            $scope.lon = $scope.entries[0].lon;
          } else {
            $scope.lat = $scope.entries[$scope.slider.activeIndex].lat
            $scope.lon = $scope.entries[$scope.slider.activeIndex].lon;
          }
        })
      });

    });

    $scope.getUrl = function (index) {
      return $sce.trustAsResourceUrl($scope.entries[index].imageUrl);
    };

    $scope.$on('$ionicView.leave', function () {
      if (document.getElementById("video" + String($scope.slider.activeIndex))) {
        document.getElementById("video" + String($scope.slider.activeIndex)).pause();
      }
      ;
      if (document.getElementById("audio" + String($scope.slider.activeIndex))) {
        var newAudio = document.getElementById("audio" + String($scope.slider.activeIndex));
        newAudio.pause();
      }
      ;
    });

    $scope.$on('$ionicView.enter', function () {
      if (document.getElementById("video" + String($scope.slider.activeIndex))) {
        document.getElementById("video" + String($scope.slider.activeIndex)).play();
      }
      ;
      if (document.getElementById("audio" + String($scope.slider.activeIndex))) {
        var newAudio = document.getElementById("audio" + String($scope.slider.activeIndex));
        newAudio.pause();
      }
      ;
    })

    $scope.zoomMin = 0.9;
    $scope.slidebind = null;

    $scope.showImages = function () {
      $scope.activeSlide = $scope.slider.activeIndex - 1;
      $scope.showModal('templates/gallery-zoomview.html');

    };

    $scope.showModal = function (templateUrl) {
      $ionicModal.fromTemplateUrl(templateUrl, {
        scope: $scope
      }).then(function (modal) {
        $scope.modal = modal;
        $scope.modal.show();
      });
    };

    $scope.closeModal = function (activeSlide) {
      $scope.slider.slideTo(activeSlide + 1, {runCallbacks: false})
      $scope.modal.hide();
      $scope.modal.remove();
    };


  })

  .controller('feedCtrl', function ($scope/*, entries*/) {
    /*    $scope.entries = entries;*/
    $scope.data = [
      {
        user: {
          name: "globl_citzen22",
          src: "https://s3.amazonaws.com/uifaces/faces/twitter/brynn/128.jpg"
        },
        src: 'img/african.JPG',
        created: '12345',
        title: 'A Day Teaching My Students!',
        location: 'Livingstone, Zambia',
        description: "I've had the most amazing opportunity these last thirty days teaching with the UN Education for All Movement. With 1 month down and 6 more to go, I wanted to show what an amazing opportunity this is and how this work matters! Say hello to my students!"
      },
      {
        user: {
          name: "thomaspescjak_ng",
          src: "https://pbs.twimg.com/profile_images/480033771261943808/g72g5VRP.jpeg"
        },
        src: 'img/kayak.jpg',
        title: 'Day 12 of 100 Days at Sea with NatGeo',
        location: 'Glacier Bay, Alaska ',
        description: "Follow me on this 12th day at sea! Make sure you take a look at the Harbor Seal that stops to say hi!"
      },
      {
        user: {
          name: "247_there",
          src: "http://i2.mirror.co.uk/incoming/article4076540.ece/ALTERNATES/s615/James-Foley.jpg"
        },
        src: 'img/raqqa.jpg',
        title: 'Live Reporting from Raqqa, Syria',
        location: 'Raqqa, Syria',
        description: 'March 10, 2016. Follow me as I make my rounds in this war devestated zone.'
      }, {
        user: {
          name: "the_seiji_san",
          src: "https://scontent.cdninstagram.com/t51.2885-19/10986285_846675908709508_2008176446_a.jpg"
        },
        src: 'img/machpicchu.jpg',
        created: '12345',
        title: 'Machu Picchu Hike',
        location: 'Cusco Region, Peru',
        description: "Machu Picchu Hike. Mom I'm alive"
      },
      {
        user: {
          name: "ontheroad11",
          src: "https://scontent.cdninstagram.com/t51.2885-19/10617164_1455421041412362_830807507_a.jpg"
        },
        src: 'img/roadtrip.jpg',
        title: 'The All American Road Trip - Day 5',
        location: 'FlagStaff, Arizona',
        description: "All American Road Trip - Day 5"
      }, {
        user: {
          name: "jr_film",
          src: "http://pbs.twimg.com/media/By0HqlmIgAA4b1U.jpg"
        },
        src: 'img/madmax.jpg',
        title: 'Onset with Mad Max',
        location: 'Otjiwarongo, Namibia',
        description: "A sneak peak coming all the way from Namibia for the filming of Mad Max. Take a look at our crew doing what we do best. Good things to come."
      }, {
        user: {
          name: "Margaux_alvarez_official",
          src: "data:image/jpeg;base64,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"
        },
        src: 'img/margauxalvarez.jpg',
        title: 'At the Crossfit Open',
        location: 'Carson, California',
        description: "At the Crossfit Games! Wish me luck and love you all! Thank you for your continued support! Without you all, I couldn't have made it this far."
      }

    ];


  })

  .controller('contributeCtrl', function ($scope, userFire, $rootScope) {
    $scope.searchText = null;
    if ($rootScope.offline.value === true) {
      $scope.users = userFire;
    }
    ;

  })

  .controller('photolistCtrl', function () {

  })


;
