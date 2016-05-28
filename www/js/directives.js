angular.module('journey.directives', ['journey.controllers'])

  .constant('WEATHER_ICONS', {
    'partlycloudy': 'ion-ios-partlysunny-outline',
    'mostlycloudy': 'ion-ios-partlysunny-outline',
    'cloudy': 'ion-ios-cloudy-outline',
    'rain': 'ion-ios-rainy-outline',
    'tstorms': 'ion-ios-thunderstorm-outline',
    'sunny': 'ion-ios-sunny-outline',
    'clear-day': 'ion-ios-sunny-outline',
    'nt_clear': 'ion-ios-moon-outline',
    'clear-night': 'ion-ios-moon-outline',
    'snow': 'ion-ios-snowy',
    'sleet': 'ion-ios-snowy',
    'partly-cloudy-night': 'ion-ios-cloudy-night-outline',
  })

  .directive('weatherIcon', function(WEATHER_ICONS) {
    return {
      restrict: 'E',
      replace: true,
      scope: {
        icon: '='
      },
      template: '<i class="customicon" ng-class="weatherIcon"></i>',
      link: function($scope) {

        $scope.$watch('icon', function(v) {
          if(!v) { return; }

          var icon = v;

          if(icon in WEATHER_ICONS) {
            $scope.weatherIcon = WEATHER_ICONS[icon];
          } else {
            $scope.weatherIcon = WEATHER_ICONS['cloudy'];
          }
        });
      }
    }
  })

  .directive('photoList', function photogramPhotoList() {
    return {
      restrict: 'E',
      scope: {
        data: '=photogram',
        profile: '=',
        loading: '='
      },
      templateUrl: 'templates/photolist.html',
      controller: 'photolistCtrl',
      controllerAs: 'vm'
    };
  })


