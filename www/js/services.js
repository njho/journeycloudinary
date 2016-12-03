angular.module('journey.services', ['ngResource'])

  .factory('Auth', function ($firebaseAuth, FirebaseUrl) {
    var ref = new Firebase(FirebaseUrl);
    var auth = $firebaseAuth(ref);
    return auth;

  })

  .factory('contribService', function() {
    var o = {};
    o.contribId = '';
    o.setContrib = function(id) {
      o.contribId = id;
      console.log('this is the contribId');
      console.log('this is the contribId' + o.contribId);
      console.log(o.contribId);
    }

    return o;
  })

  .factory('captureService', function ($rootScope) {
    var o = {};
    o.url = "";
    o.mimeType = '';
    o.key = '';
    return o;
  })


  .factory('Amazon', function () {

    var o = {};


    Date.prototype.yyyymmdd = function () {
      var yyyy = this.getFullYear().toString();
      var mm = (this.getMonth() + 1).toString(); // getMonth() is zero-based
      var dd = this.getDate().toString();
      console.log("example" + yyyy + (mm[1] ? mm : "0" + mm[0]) + (dd[1] ? dd : "0" + dd[0]));
      return yyyy + (mm[1] ? mm : "0" + mm[0]) + (dd[1] ? dd : "0" + dd[0]); // padding
    };
    var dateStamp = new Date();

    o.isoDate = function () {
      return dateStamp.yyyymmdd() + "T000000Z"
    };

    o.getSignatureKey = function () {

      var key = "6jQ1u/1eYKcjnfF/bTBcddo8Av3iaUCGYmEpyzjp";

      /*
       var regionName = "us-west-2";
       var serviceName = "s3";
       //Confirmed signature works 2016-04-16 http://docs.aws.amazon.com/general/latest/gr/signature-v4-examples.html#signature-v4-examples-jscript
       var kDate = CryptoJS.HmacSHA256('20160417','AWS4'+key);
       console.log('kdate: ' + kDate.toString(CryptoJS.enc.Hex));
       var kRegion = CryptoJS.HmacSHA256(regionName, kDate, { asBytes: true});
       console.log('kregion: '+ kRegion);
       var kService = CryptoJS.HmacSHA256(serviceName, kRegion, { asBytes: true});
       console.log('kService: ' + kService);
       var kSigning = CryptoJS.HmacSHA256("aws4_request", kService, { asBytes: true});
       console.log("kSigningkey: " + kSigning.toString(CryptoJS.enc.Hex));
       console.log(kSigning);
       */

      //RETURNED VALUE DOES NOT NEED TO BE HEX ECNODED. iS ALREADY (BINARY)

      return key;
    }
    /*    var expiration = function() {
     var expiry = new Date();
     expiry.setFullYear(2020);
     expiry.toISOString();
     console.log(expiry);
     return expiry;
     };*/

    o.getBase64Policy = function () {

      var policy = {
        "expiration": "2020-12-01T12:00:00.000Z",
        "conditions": [
          {"bucket": "journeyapp"},
          ["starts-with", "$key", ""],
          {"acl": 'public-read'},
          ["content-length-range", 0, 524288000],
          ["starts-with", "$Content-Type", ""],
          //["starts-with", "$X-Amz-Date", ""],
          //["starts-with", "$X-Amz-expires", ""],
          //["starts-with", "$X-Amz-credential", ""],
          //["starts-with", "$x-amz-algorithm", '']
        ]
      };

      console.log(policy);

      var kstringToSign = CryptoJS.enc.Utf8.parse(JSON.stringify(policy)); //Word Array Object
      var base64 = CryptoJS.enc.Base64.stringify(kstringToSign);//Base 64 Policy
      console.log('Base 64 Policy: ' + base64);
      return base64;
    };

    o.getSignature = function () {
      var stringToSign = o.getBase64Policy();
      console.log(stringToSign);
      var signingKey = o.getSignatureKey();
      console.log('SIGNING KEY (should be secret): ' + signingKey);

      var signature = CryptoJS.HmacSHA1(stringToSign, signingKey, {asBytes: true});
      console.log('signature: ' + signature);
      var base64 = CryptoJS.enc.Base64.stringify(signature);//Base 64 Policy
      //For signature version 4 only
      //var hexSig = signature.toString(CryptoJS.enc.Hex);

      console.log('base64 signature: ' + base64);
      return base64;

    };

    o.upload = function (imageURI, mimeType, uid, eid) {
      var imageURI = imageURI;
      var mimeType = mimeType;

      var Uoptions = {};
      Uoptions.fileKey = "file";
      Uoptions.fileName = imageURI;
      Uoptions.mimeType = mimeType;
      Uoptions.chunkedMode = false;
      Uoptions.headers = {'connection': 'close'};

      Uoptions.params = {
        //"key": "/${filename}",
        "acl": "public-read",
        "Content-Type": mimeType,
        //"X-Amz-Credential": "AKIAJ7ETB75NWXDDTRSQ/20160417/us-west-2/s3/aws4_request",
        //"X-Amz-Algorithm": "AWS4-HMAC-SHA256",
        //"X-Amz-Date": "20160417T000000Z",
        //"X-Amz-Expires": "604800",
        "AWSAccessKeyId": "AKIAJ7ETB75NWXDDTRSQ",
        "Policy": o.getBase64Policy(),
        "signature": o.getSignature()
      };
      Uoptions.params.key = uid + '/' + eid + '/${filename}';

      return {
        Uoptions: Uoptions
      };

    }
    return o;
  })

  .factory('User', function (FirebaseUrl, $firebaseArray, $localStorage) {

    var usersRef = new Firebase(FirebaseUrl + 'users');
    var users = $firebaseArray(usersRef);

    var o = {};
    o.profile = {};

    o.isNewUser = function (uid) {
      var hasId;
      usersRef.once('value', function (snapshot) {
        hasId = snapshot.hasChild(uid);
      })
      return hasId;
    };

    o.createUser = function (authData) {
      console.log('Creating User Node in Firebase!');
      usersRef.child(authData.uid).set({
        displayName: authData.facebook.displayName,
        profilePic: authData.facebook.profileImageURL
      });
    };

    o.setUser = function (authData) {
      if ($localStorage.storageAuth) {
        o.profile = $localStorage.storageAuth;
        console.log('here is the profile info for firebase: ');
        console.log(o.profile);


      } else {
        o.profile.displayName = authData.facebook.cachedUserProfile.first_name;
        o.profile.profileUrl = authData.facebook.profileImageURL;
        o.profile.uid = authData.uid;
        o.profile.lid = o.profile.uid.replace('facebook:', '');
        o.profile.token = authData.token;
      }
      ;


    };

    o.getProfile = function () {
      return o.profile;
    }

    return o;
  })


  .factory('experiencesService', function () {

    var e = [];

    e.experiences = [{
      id: '1',
      name: 'Andaman Islands ',
      date: 'April 22, 2012',
      description: 'Taking the scooter around the Andaman Islands!',
      location: 'Havelock, Andaman Islands',
      weather: 'ion-ios-partlysunny-outline',
      image: 'img/q.jpg',
      dirname: null
    }, {
      id: '2',
      name: 'West Coast Trail  ',
      date: 'September 2, 2016',
      description: 'Day 1',
      location: 'Vancouver, BC',
      weather: 'ion-ios-rainy-outline',
      image: 'img/s.jpg',
      dirname: null
    }];

    return e;

  })

  .factory('experienceService', function () {

    var e = []

    e.info = {
      id: '1',
      name: 'Andaman Islands',
      date: 'April 22, 2013',
      description: 'Day 2 of our trek in tiger leaping gorge with Adam, Tyrone and me!',
      location: 'Li Jiang, China',
      weather: 'ion-ios-partlysunny-outline',
      image: '/img/q.jpg',
      dirname: null
    };

    e.photodata = {
      lat: '12.026808',
      lon: '93.002673',
      src: null
    };

    e.results = [
      {
        lat: '12.026808',
        lon: '93.002673',
        imageUrl: 'img/imageSequence00000174.jpg',
        description: 'Heading "downtown" on Havelock Island! '
      }, {
        lat: '12.027763',
        lon: '93.001740',
        imageUrl: 'img/imageSequence00000182.jpg',
        description: ''

      }, {
        lat: '12.029337',
        lon: '92.999229',
        imageUrl: 'img/imageSequence00000187.jpg',
        description: 'Imagine waking up every morning to this... every day.'
      }, {
        lat: '12.030526',
        lon: '92.997510',
        imageUrl: 'img/imageSequence00000218.jpg',
        description: ''
      }, {
        lat: '12.030817',
        lon: '92.996198',
        imageUrl: 'img/imageSequence00000224.jpg',
        description: ''
      }, {
        lat: '12.030724',
        lon: '92.996583',
        imageUrl: 'img/imageSequence00000226.jpg',
        description: ''
      }, {
        lat: '12.030619',
        lon: '92.995778',
        imageUrl: 'img/imageSequence00000228.jpg',
        description: ''
      }, {
        lat: '12.030188',
        lon: '92.994716',
        imageUrl: 'img/imageSequence00000236.jpg',
        description: ''
      }, {
        lat: '12.030429',
        lon: '92.994416',
        imageUrl: 'img/imageSequence00000240.jpg',
        description: ''
      }, {
        lat: '12.030534',
        lon: '92.994255',
        imageUrl: 'img/imageSequence00000241.jpg',
        description: ''
      }, {
        lat: '12.030219',
        lon: '92.994158',
        imageUrl: 'img/imageSequence00000243.jpg',
        description: ''
      }, {
        lat: '12.028894',
        lon: '92.993867',
        imageUrl: 'img/imageSequence00000247.jpg',
        description: ''
      }, {
        lat: '12.028453',
        lon: '92.993728',
        imageUrl: 'img/imageSequence00000253.jpg',
        description: ''
      }, {
        lat: '12.028453',
        lon: '92.993728',
        imageUrl: 'img/imageSequence00000255.jpg',
        description: ''
      }, {
        lat: '12.028453',
        lon: '92.993728',
        imageUrl: 'img/imageSequence00000314.jpg',
        description: 'My tire ended up blowing on the way there :/ Thankfully "Vinit" at the gas station was able to help me out! He set me up with a new tire in literally 10 minutes. I\'ll never forget his hospitality!'
      }
    ];

    return e;
  })

  .factory('mapService', function () {
    var o = {};
    o.markerRed = {
      url: 'img/redmarker.png',
      size: [20, 20],
      anchor: [7.5, 7.5]
    };
    o.markerGreen = {
      url: 'img/greenmarker.png',
      size: [30, 30],
      anchor: [10, 10]
    };
    return o;

  })

  .factory('slideInfo', function () {
    var o = {};
    o.counter = 0;
    o.newSlide = 0;

    o.slideChange = function (direction, resultsLength) {
      if (direction === 1) {
        if (o.counter === resultsLength - 2) {
          o.counter++;
          o.newSlide = 0;
          console.log(' counter isnewSlide: ' + o.newSlide);

        } else if (o.counter === resultsLength - 1) {
          o.counter = 0;
          o.newSlide = o.counter + 2;
          console.log('newSlide: ' + o.newSlide);

        } else {
          o.counter++;
          o.newSlide = o.counter + 1;
          console.log('newSlide: ' + o.newSlide);
        }
      } else {
        if (o.counter === 0) {
          o.counter = resultsLength - 1;
          o.newSlide = resultsLength - 2;
          console.log(' counter isnewSlide: ' + o.newSlide);

        } else if (o.counter === 1) {
          o.counter--;
          o.newSlide = resultsLength - 1;
          console.log('newSlide: ' + o.newSlide);

        } else {
          o.counter--;
          o.newSlide = o.counter - 1;
          console.log('newSlide: ' + o.newSlide);
        }
      }
    }
    return o;

  })

  .factory('manualCaptureService', function () {

    var o = {};


    return o;


  })

  .factory('geolocationService', function () {
    var o = {};
    return o;

  })

  //Used to compile what is seen in the news feed
  .factory('feedFire', function ($firebaseArray, FirebaseUrl) {
    var feedRef = new Firebase(FirebaseUrl + 'feedfire');
    return {
      feedArray: function () {
        return $firebaseArray(feedRef.limitToLast(10));
      }
    }
  })

  //used to compile a user's: Experiences, Experience likes, database eid
  .factory('userMetaFire', function ($firebaseArray, FirebaseUrl) {
    var userMetaRef = new Firebase(FirebaseUrl + 'user_meta');
    //return function (user) {
    return $firebaseArray(userMetaRef.child('facebook:A10154035067882095')).$loaded();
    //}
  })

  //Container of all Journey's

  .factory('journeyFire', function ($firebaseArray, FirebaseUrl) {
    var journeyRef = new Firebase(FirebaseUrl + 'journeyfire/');
    return {
      journeyArray: function (key) {
        return $firebaseArray(journeyRef.child(key));
      }
    }
  })

  .factory('userFire', function ($firebaseArray, FirebaseUrl) {
    var userFireRef = new Firebase(FirebaseUrl + 'users');
    //return function (user) {
    return $firebaseArray(userFireRef);
    //}
  })

  .factory('submit', function () {

  })

  .factory('fireLoader', function ($localStorage, Firebase, FirebaseUrl, User) {
    var o = {};
    o.upload = function (info, parentKey, filename) {
//Initiate save to journeyFiref
      var parentKey = parentKey;
      var info = info;
      var filename = filename;
      var extension;
      var root;

      switch (info.mimeType) {
        case 'image/jpeg':
          extension = '.jpg';
          root = "https://res.cloudinary.com/dem9ilv6g/image/upload/";
          break;
        case 'audio/mp4':
          extension = '.m4a';
          root = "https://s3-us-west-2.amazonaws.com/journeyapp/"
          break;
        case 'video/mp4':
          extension = '.mp4';
          root = "https://res.cloudinary.com/dem9ilv6g/video/upload/";
          break;
      };

      var ref = new Firebase(FirebaseUrl);


      //Generate pushID for new experience inside of parentJourney
      var newJourneyRef = ref.child("journeyfire").push();
      var newExpKey = newJourneyRef.key();

      var updateJourneyData = {};
      /*      updateJourneyData["user_meta/" + User.profile.uid + "/" + newExpKey] = true;/!*{
       key: newJourneyKey,
       };*!/*/


      updateJourneyData["/journeyfire/" + parentKey + '/' + newExpKey] = {
        key: newExpKey,
        title: info.title,
        description: info.description,
        imageUrl: root + User.profile.lid + "/" + parentKey + '/' + filename + extension,
        timeStamp: info.timeStamp * 1000,
        lat: info.lat,
        lon: info.lon,
        user: info.user,
        userImg: info.userImg,
        likes: info.likes,
        weather: info.weather,
        temp: info.temp,
        contrib: 'true',
        live: info.live
      };

      console.log(User.profile.uid);

      ref.update(updateJourneyData, function (error) {
        if (error) {
          console.log("Error updating data:", error);
        }
      });
    };

    o.uploadNew = function (info, newJourneyRef, newJourneyKey, filename) {
//Initiate save to journeyFire
      var info = info;
      var filename = filename;
      var newJourneyRef = newJourneyRef;
      var newJourneyKey = newJourneyKey;
      var extension;
      var root;
      var thumbRoot;


      switch (info.mimeType) {
        case 'image/jpeg':
          extension = '.jpg';
          root = "https://res.cloudinary.com/dem9ilv6g/image/upload/";
          thumbRoot = "https://res.cloudinary.com/dem9ilv6g/image/upload/c_thumb,h_150,w_150/";
          break;
        case 'audio/mp4':
          extension = '.m4a';
          root = "https://s3-us-west-2.amazonaws.com/journeyapp/"
          break;
        case 'video/mp4':
          extension = '.mp4';
          root = "https://res.cloudinary.com/dem9ilv6g/video/upload/";
          thumbRoot = "https://res.cloudinary.com/dem9ilv6g/video/upload/";
          break;
      };


      var ref = new Firebase(FirebaseUrl);
      var newEntryRef = ref.child('journeyfire').child(newJourneyKey).push();
      var newEntryKey = newEntryRef.key();

      var updateJourneyData = {};

      //Changelog 05-09-2016: Changed to having only boolean for journey key to containing title description, etc.
      updateJourneyData["user_meta/" + User.profile.uid + "/" + newJourneyKey] = {
        key: newJourneyKey,
        user: info.user,
        title: info.title,
        description: info.description,
        imageUrl: root + User.profile.lid + "/" + newJourneyKey + '/' + filename + extension,
        imageThumb: thumbRoot + User.profile.lid + "/" + newJourneyKey + '/' + filename + '.jpg',
        timeStamp: info.timeStamp * 1000,
        lat: info.lat,
        lon: info.lon,
        weather: info.weather,
        temp: info.temp,
        contrib: 'true',
        live: info.live
      };
      /*{
       key: newJourneyKey,
       };*/
      updateJourneyData["/journeyfire/" + newJourneyKey + '/' + newEntryKey] = {
        key: newJourneyKey,
        title: info.title,
        description: info.description,
        imageUrl: root + User.profile.lid + "/" + newJourneyKey + '/' + filename + extension,
        timeStamp: info.timeStamp * 1000,
        lat: info.lat,
        lon: info.lon,
        user: info.user,
        userImg: info.userImg,
        likes: info.likes,
        weather: info.weather,
        temp: info.temp,
        contrib: 'true',
        live: info.live
      };
      updateJourneyData["/feedfire/" + newJourneyKey] = {
        key: newJourneyKey,
        title: info.title,
        description: info.description,
        setImageUrl: root + User.profile.lid + "/" + newJourneyKey + '/' + filename + extension,
        user: info.user,
        userImg: info.userImg,
        likes: info.likes,
        timeStart: info.timeStamp * 1000,
        contrib: 'true'
      };
      console.log('from inside firebase update: ');
      console.log(updateJourneyData);


      ref.update(updateJourneyData, function (error) {
        if (error) {
          console.log("Error updating data:", error);
        }
      });

    };

    return o;

  })

  .factory('amaLoader', function ($q, $cordovaFileTransfer, $ionicLoading, $state) {

    var o = {};

    o.upload = function (url, params, info, uid, eid) {
      var info = info;
      var url = url;
      var filename = info.filename;
      console.log('upload filename:' + info.filename);
      console.log(filename);
      var preset;
      var resourceType;


      //Honestly, I'd like to change this so that I upload a JSON object which has all this information. This is kinda shitty.
      switch (info.type) {
        case 'new':
          preset = 'newjourney';
          console.log(preset);
          break;
        case 'update':
          preset = 'addjourney';
          console.log(preset);
          break;
      }      ;

      switch (info.mimeType) {
        case 'video/mp4':
          resourceType = 'video';
          console.log('video');
          break;
        case 'image/jpeg':
          resourceType = 'auto';
          console.log('image');
          break;
      };

      console.log(url);
      console.log(info);

      if (info.mimeType === "audio/mp4") {
        var url = url;
        var params = params;

        $cordovaFileTransfer.upload("https://journeyapp.s3.amazonaws.com/", url, params)
          .then(function (result) {
            // Success!
            // Let the user know the upload is completed
            $ionicLoading.show({template: 'Upload Success!', duration: 3000});
            console.log('upload to s3 succeed ', result);
            $state.go('tab.journey');


          }, function (err) {
            // Error
            // Uh oh!
            $ionicLoading.show({template: 'Upload Failed', duration: 3000});
            console.log('upload to s3 fail ', err);
          }, function (progress) {

            // constant progress updates
          });

      } else {

        var deferred = $q.defer();
        var fileSize;
        var percentage;
        // Find out how big the original file is
        window.resolveLocalFileSystemURL(url, function (fileEntry) {
          console.log('from inside uploader');
          console.log(url);
          fileEntry.file(function (fileObj) {

            fileSize = fileObj.size;
            console.log('fileSize');
            console.log(fileSize);
            // Display a loading indicator reporting the start of the upload
            $ionicLoading.show({template: 'Uploading Picture : ' + 0 + '%'});
            // Trigger the upload
            uploadFile();
          });
        });
        function uploadFile() {
          console.log('uploadFile filename:' + filename);
          console.log(filename);
          // Add the Cloudinary "upload preset" name to the headers
          var uploadOptions = {
            params: {
              'resource_type': resourceType,
              'upload_preset': preset,
              'folder': uid + '/' + eid + '/',
              'public_id': filename
            }  //CLOUDINARY_CONFIGS.UPLOAD_PRESET
          };
          $cordovaFileTransfer
          // Your Cloudinary URL will go here
            .upload('https://api.cloudinary.com/v1_1/dem9ilv6g/' + resourceType + '/upload', url, uploadOptions)  //

            .then(function (result) {
              // Let the user know the upload is completed
              $ionicLoading.show({template: 'Upload Completed', duration: 1000});
              // Result has a "response" property that is escaped
              // FYI: The result will also have URLs for any new images generated with
              // eager transformations
              var response = JSON.parse(decodeURIComponent(result.response));
              deferred.resolve(response);
              $state.go('tab.journey');
            }, function (err) {
              // Uh oh!
              $ionicLoading.show({template: 'Upload Failed', duration: 3000});
              console.log(err);
              deferred.reject(err);
            }, function (progress) {
              // The upload plugin gives you information about how much data has been transferred
              // on some interval.  Use this with the original file size to show a progress indicator.
              percentage = Math.floor(progress.loaded / fileSize * 100);
              $ionicLoading.show({template: 'Uploading Picture : ' + percentage + '%'});
            });
        }

        return deferred.promise;
      };

    };


    return o;

  })

  .factory('weatherApi', function (weatherApiKey, $q, $resource, $http) {
    var url = 'https://api.forecast.io/forecast/' + weatherApiKey + '/';

    /*  var weatherResource = $resource(url, {
     callback: 'JSON_CALLBACK',
     }, {
     get: {
     method: 'JSONP'
     }
     });*/

    return {
      getCurrentWeather: function (lat, lon) {
        return $http.jsonp(url + lat + ',' + lon + '?callback=JSON_CALLBACK' + '&units=si');
      },
      getPastWeather: function (lat, lon, time) {
        return $http.jsonp(url + lat + ',' + lon + ',' + time + '?callback=JSON_CALLBACK' + '&units=si');
      }
    }
  })


;
