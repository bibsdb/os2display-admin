/**
 * @file
 * Contains the itkSharedChannelPickerWidget module.
 */

/**
 * Setup the module.
 */
(function() {
  "use strict";

  var app;
  app = angular.module("itkSharedChannelPickerWidget", []);

  /**
   * shared-channel-picker-widget directive.
   *
   * html parameters:
   *   screen (object): The screen to modify.
   *   region (integer): The region of the screen to modify.
   */
  app.directive('sharedChannelPickerWidget', ['configuration', 'userFactory', 'sharedChannelFactory', '$timeout',
    function(configuration, userFactory, sharedChannelFactory, $timeout) {
      return {
        restrict: 'E',
        replace: true,
        templateUrl: 'app/shared/widgets/sharedChannelPickerWidget/shared-channel-picker-widget.html',
        scope: {
          screen: '=',
          region: '='
        },
        link: function(scope) {
          scope.index = {};
          scope.loading = false;
          scope.pickIndexDialog = false;

          scope.displaySharingOption = configuration.sharingService.enabled;
          scope.sharingIndexes = [];
          sharedChannelFactory.getSharingIndexes().then(function(data) {
            scope.sharingIndexes = data;
          });

          // Set default orientation and sort.
          scope.orientation = 'landscape';
          scope.showFromUser = 'all';
          scope.sort = { "created_at": "desc" };

          userFactory.getCurrentUser().then(
            function(data) {
              scope.currentUser = data;
            }
          );

          // Default pager values.
          scope.pager = {
            "size": 9,
            "page": 0
          };
          scope.hits = 0;

          // Channels to display.
          scope.channels = [];

          // Setup default search options.
          var search = {
            "fields": 'title',
            "text": '',
            "filter": {
              "bool": {
                "must": {
                  "term": {
                    "orientation":  scope.orientation
                  }
                }
              }
            },
            "sort": {
              "created_at" : {
                "order": "desc"
              }
            },
            'pager': scope.pager
          };

          /**
           * Updates the channels array by send a search request.
           */
          scope.updateSearch = function updateSearch() {
            if (scope.index === {}) {
              return;
            }

            // Get search text from scope.
            search.text = scope.search_text;

            scope.loading = true;
            sharedChannelFactory.searchChannels(search, scope.index.index).then(
              function(data) {
                scope.loading = false;
                scope.hits = data.hits;
                scope.channels = data.results;
              },
              function () {
                scope.loading = false;
              }
            );
          };

          /**
           * Emits the channelSharingOverview.clickChannel event.
           *
           * @param channel
           * @param index
           */
          scope.clickSharedChannel = function clickSharedChannel(channel, index) {
            scope.$emit('channelSharingOverview.clickSharedChannel', channel, index);
          };

          /**
           * Change which index is selected.
           * @param index
           */
          scope.setIndex = function setIndex(index) {
            scope.index = index;
            scope.pickIndexDialog = false;

            $timeout(
              function() {
                scope.updateSearch();
              }
              , 10);
          };

          /**
           * Returns true if channel is in channel array with region.
           *
           * @param channel
           * @returns {boolean}
           */
          scope.channelSelected = function channelSelected(channel) {
            var element;
            for (var i = 0; i < scope.screen.channel_screen_regions.length; i++) {
              element = scope.screen.channel_screen_regions[i];
              if (element.shared_channel && element.shared_channel.id === channel.id && element.region === scope.region) {
                return true;
              }
            }
            return false;
          };

          /**
           * Adding a channel to screen region.
           * @param channel
           *   Channel to add to the screen region.
           */
          scope.addChannel = function addChannel(channel) {
            scope.screen.channel_screen_regions.push({
              "id": null,
              "screen_id": scope.screen.id,
              "shared_channel": channel,
              "region": scope.region
            });
          };

          /**
           * Removing a channel from a screen region.
           * @param channel
           *   Channel to remove from the screen region.
           */
          scope.removeChannel = function removeChannel(channel) {
            var element;
            for (var i = 0; i < scope.screen.channel_screen_regions.length; i++) {
              element = scope.screen.channel_screen_regions[i];
              if (element.shared_channel && element.shared_channel.id === channel.id && element.region === scope.region) {
                scope.screen.channel_screen_regions.splice(i, 1);
              }
            }
          };

          /**
           * When the screen is loaded, set search orientation.
           */
          scope.$watch('screen', function (val) {
            if (!val) return;

            // Set the orientation.
            scope.orientation = scope.screen.orientation;

            // Update the search.
            scope.updateSearch();
          });
        }
      };
    }
  ]);
}).call(this);
