/**
 * @file
 * Contains the screen factory.
 */

/**
 * Screen factory. Main entry point for screens and screen groups.
 */
angular.module('ikApp').factory('screenFactory', ['$http', '$q', 'searchFactory',
  function($http, $q, searchFactory) {
    var factory = {};
    var currentScreen = null;

    /**
     * Search via search_node.
     * @param search
     * @returns {*|Number}
     */
    factory.searchScreens = function(search) {
      search.type = 'Indholdskanalen\\MainBundle\\Entity\\Screen';
      return searchFactory.search(search);
    };

    /**
     * Get all screens.
     *
     * @returns {Array}
     */
    factory.getScreens = function() {
      var defer = $q.defer();

      $http.get('/api/screens')
        .success(function(data) {
          defer.resolve(data);
        })
        .error(function(data, status) {
          defer.reject(status);
        });

      return defer.promise;
    };

    /**
     * Load the screens with the given ids.
     *
     * @param ids
     */
    factory.loadScreensBulk = function loadScreensBulk(ids) {
      var defer = $q.defer();

      // Build query string.
      var queryString = "?";
      for (var i = 0; i < ids.length; i++) {
        queryString = queryString + "ids[]=" + ids[i];
        if (i < ids.length - 1) {
          queryString = queryString + "&"
        }
      }

      // Load bulk.
      $http.get('/api/screens/bulk' + queryString)
        .success(function(data, status) {
          defer.resolve(data);
        })
        .error(function(data, status) {
          defer.reject(status)
        });

      return defer.promise;
    };

    /**
     * Get the current screen.
     * @param id
     * @returns {promiseAndHandler.promise|*|Promise._progressUnchecked.promise|promise|exports.exports.Reduction.promise|PromiseResolver.promise}
     */
    factory.getEditScreen = function(id) {
      var defer = $q.defer();

      if (id === null || id === undefined || id === '') {
        defer.resolve(currentScreen);
      } else {
        $http.get('/api/screen/' + id)
          .success(function(data) {
            currentScreen = data;
            defer.resolve(currentScreen);
          })
          .error(function(data, status) {
            defer.reject(status);
          });
      }

      return defer.promise;
    };

    /**
     * Find the screen with @id
     * @param id
     * @returns screen or null
     */
    factory.getScreen = function(id) {
      var defer = $q.defer();

      $http.get('/api/screen/' + id)
        .success(function(data) {
          defer.resolve(data);
        })
        .error(function(data, status) {
          defer.reject(status);
        });

      return defer.promise;
    };

    /**
     * Saves screen.
     */
    factory.saveScreen = function() {
      var defer = $q.defer();

      if (currentScreen === null) {
        defer.reject(404);
      } else {
        if (parseInt(currentScreen.width) > parseInt(currentScreen.height)) {
          currentScreen.orientation = 'landscape';
        } else {
          currentScreen.orientation = 'portrait';
        }

        $http.post('/api/screen', currentScreen)
          .success(function(data) {
            defer.resolve(data);
          })
          .error(function(data, status) {
            defer.reject(status);
          });
      }

      return defer.promise;
    };

    /**
     * Returns an empty screen.
     * @returns screen (empty)
     */
    factory.emptyScreen = function() {
      currentScreen = {
        id: null,
        template: 'full-screen',
        description: '',
        title: '',
        orientation: '',
        channels: [],
        width: 1920,
        height: 1080
      };

      return currentScreen;
    };

    return factory;
  }
]);

