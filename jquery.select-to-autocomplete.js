/*
Version: 1.0.5

Documentation: http://baymard.com/labs/country-selector#documentation

Copyright (C) 2011 by Jamie Appleseed, Baymard Institute (baymard.com)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/
(function($){
  var settings = {
    'sort': false,
    'sort-attr': 'data-priority',
    'sort-desc': false,
    'autoselect': true,
    'free-insert': false,
    'default-renderer': '<a><div class="flag-img"><img src="{flag}" /></div><p class="country-name">{name}</p><p class="country-code">+{code}</p><p class="country-price">{currency} {price}</p></a><div style="clear:both"></div>',
    'contacts': false,
    'contacts-attr': 'data-contact',
    'contacts-renderer': '',
    'flags': false,
    'flags-attr': 'data-flag',
    'flags-dir': './flags/',
    'flags-default': 'LV.png',
    'flags-image-selector':'#flag',
    'code': false,
    'code-show': false,
    'code-attr': 'data-code',
    'code-default': '371',
    'code-selector':'#code',
    'price': false,
    'price-attr': 'data-price',
    'price-default': '0',
    'price-currency': '&euro;',
    'alternative-spellings': true,
    'alternative-spellings-attr': 'data-alternative-spellings',
    'remove-valueless-options': true,
    'copy-attributes-to-text-field': true,
    'autocomplete-plugin': 'jquery_ui',
    'relevancy-sorting': true,
    'relevancy-sorting-partial-match-value': 2,
    'relevancy-sorting-strict-match-value': 5,
    'relevancy-sorting-booster-attr': 'data-relevancy-booster',
    handle_invalid_input: function( context ) {
      if (!settings['free-insert'])
      {
      context.$text_field.val( context.$select_field.find('option:selected:first').val() );
      }
    },
    handle_select_field: function( $select_field ) {
      return $select_field.hide();
    },
    insert_text_field: function( context ) {
        console.log(context);
      var $text_field = $( "<input></input>" );
      if ( settings['copy-attributes-to-text-field'] ) {
        var attrs = {};
        var raw_attrs = context.$select_field[0].attributes;
        for (var i=0; i < raw_attrs.length; i++) {
          var key = raw_attrs[i].nodeName;
          var value = raw_attrs[i].nodeValue;
          if ( key !== 'name' && key !== 'id' && typeof context.$select_field.attr(key) !== 'undefined' ) {
            attrs[key] = value;
          }
        };
        $text_field.attr( attrs );
      }
      $text_field.blur(function() {
        var valid_values = context.$select_field.find('option').map(function(i, option) { return $(option).val(); });
        if ( !($text_field.val() in valid_values) && typeof settings['handle_invalid_input'] === 'function' ) {
          settings['handle_invalid_input'](context);
        }
      });

      // give the input box the ability to select all text on mouse click
      if ( context.settings['autoselect'] ) {
         $text_field.click( function() {
             this.select();
            });
      }
      return $text_field.val( context.$select_field.find('option:selected:first').val() )
        .insertAfter( context.$select_field );
    },
    extract_options: function( $select_field ) {
      var options = [];
      var $options = $select_field.find('option');
      var number_of_options = $options.length;

      // go over each option in the select tag
      $options.each(function(){
        var $option = $(this);
        var option = {
          'real-value': $option.attr('value'),
          'label': $option.val(),
          'text': $option.text()
        }
        if ( settings['remove-valueless-options'] && option['real-value'] === '') {
          // skip options without a value
        } else {

          if (settings['flags']) {
              // prepare flag
              option['flag'] = option['flags-default'];
              var flag = $option.attr( settings['flags-attr'] );
              if (flag)
              {
                  option['flag'] = flag;
              }
          }

          if (settings['code']) {
              // prepare international code
              option['code'] = settings['code-default'];
              var code = $option.attr( settings['code-attr'] );
              if (code)
              {
                  option['code'] = code;
              }
          }

          if (settings['price']) {
              // prepare price code
              option['price'] = settings['price-default'];
              var price = $option.attr( settings['price-attr'] );
              if (price)
              {
                  option['price'] = price;
              }
          }

          // prepare the 'matches' string which must be filtered on later
          option['matches'] = option['label'];
          var alternative_spellings = $option.attr( settings['alternative-spellings-attr'] );
          if ( alternative_spellings ) {
            option['matches'] += ' ' + alternative_spellings;
            // adding international code to matches
            if (code)
            {
                option['matches'] += ' 00' + code + ' +' + code + ' ' + code;
            }
          }

          // give each option a weight parameter for sorting
          if ( settings['sort'] ) {
            var weight = parseInt( $option.attr( settings['sort-attr'] ), 10 );
            if ( weight ) {
              option['weight'] = weight;
            } else {
              option['weight'] = number_of_options;
            }
          }

          // is contact or not
          if ( settings['contacts'] ) {
            var contact = $option.attr( settings['contacts-attr'] );
            if ( contact ) {
              option['contact'] = true;
            } else {
              option['contact'] = false;
            }
          }

          // add relevancy score
          if ( settings['relevancy-sorting'] ) {
            option['relevancy-score'] = 0;
            option['relevancy-score-booster'] = 1;
            var boost_by = parseFloat( $option.attr( settings['relevancy-sorting-booster-attr'] ) );
            if ( boost_by ) {
              option['relevancy-score-booster'] = boost_by;
            }
          }
          // add option to combined array
          options.push( option );
        }
      });
      // sort the options based on weight
      if ( settings['sort'] ) {
        if ( settings['sort-desc'] ) {
          options.sort( function( a, b ) { return b['weight'] - a['weight']; } );
        } else {
          options.sort( function( a, b ) { return a['weight'] - b['weight']; } );
        }
      }

      // return the set of options, each with the following attributes: real-value, label, matches, weight (optional)
      return options;
    },
    // callback
    source: function (request, response) {
    },
    select: function (event, ui) {
    }
  };

  var public_methods = {
    init: function( customizations ) {

      if ( $.browser.msie && parseInt($.browser.version, 10) <= 6) {

        return this;

      } else {

        settings = $.extend( {}, settings, customizations );

        return this.each(function(){
          var $select_field = $(this);

          var context = {
            '$select_field': $select_field,
            'options': settings['extract_options']( $select_field ),
            'settings': settings
          };

          context['$text_field'] = settings['insert_text_field']( context );

          settings['handle_select_field']( $select_field );

          if ( typeof settings['autocomplete-plugin'] === 'string' ) {
            adapters[settings['autocomplete-plugin']]( context );
          } else {
            settings['autocomplete-plugin']( context );
          }
        });

      }

    }
  };

  var adapters = {
    jquery_ui: function( context ) {
      // loose matching of search terms
      var filter_options = function( term ) {
        var split_term = term.split(' ');
        var matchers = [];
        for (var i=0; i < split_term.length; i++) {
          if ( split_term[i].length > 0 ) {
            var matcher = {};
            matcher['partial'] = new RegExp( $.ui.autocomplete.escapeRegex( split_term[i] ), "i" );
            if ( context.settings['relevancy-sorting'] ) {
              matcher['strict'] = new RegExp( "^" + $.ui.autocomplete.escapeRegex( split_term[i] ), "i" );
            }
            matchers.push( matcher );
          }
        };

        return $.grep( context.options, function( option ) {
          var partial_matches = 0;
          if ( context.settings['relevancy-sorting'] ) {
            var strict_match = false;
            var split_option_matches = option.matches.split(' ');
          }
          for ( var i=0; i < matchers.length; i++ ) {
            if ( matchers[i]['partial'].test( option.matches ) ) {
              partial_matches++;
            }
            if ( context.settings['relevancy-sorting'] ) {
              for (var q=0; q < split_option_matches.length; q++) {
                if ( matchers[i]['strict'].test( split_option_matches[q] ) ) {
                  strict_match = true;
                  break;
                }
              };
            }
          };
          if ( context.settings['relevancy-sorting']) {
            var option_score = 0;
            option_score += partial_matches * context.settings['relevancy-sorting-partial-match-value'];
            if ( strict_match ) {
              option_score += context.settings['relevancy-sorting-strict-match-value'];
            }
            option_score = option_score * option['relevancy-score-booster'];
            option['relevancy-score'] = option_score;
          }

          if (context.settings['contacts']) {

              if (option['contact']) {
                  contact = true;
              } else {
                  contact = false;
              }

          } else {
              contact = false;
          }

          return ( (!term && !contact) || ((matchers.length === partial_matches) && term) );
        });

      }

      // simple bubblesort, because JS sort function is not working properly in Chrome
      var bubbleSort = function (arr)
      {
          var swapped;
        do {
            swapped = false;
            for (var i=0; i < arr.length-1; i++) {
                if (arr[i]['relevancy-score'] < arr[i+1]['relevancy-score']) {
                    var temp = arr[i];
                    arr[i] = arr[i+1];
                    arr[i+1] = temp;
                    swapped = true;
                }
            }
         } while (swapped);

         return arr;
      }

      var update_flag = function ( option ) {
          // changing flag
        if (context.settings['flags'] && (typeof (option) !== 'undefined') )
        {
            $(context.settings['flags-image-selector']).attr('src', context.settings['flags-dir'] + option['flag']);
        }
      }
      // update the select field value using either selected option or current input in the text field
      var update_select_value = function( option ) {
        if ( option ) {
          if ( context.$select_field.val() !== option['real-value'] ) {
            context.$select_field.val( option['real-value'] );

            update_flag( option );

            // changing international code
            if (context.settings['code'] && context.settings['code-show'])
            {
                if (option['code'])
                {
                    $(context.settings['code-selector']).text('+' + option['code']);
                } else {
                    $(context.settings['code-selector']).text('+' + context.settings['code-default']);
                }

            }

            context.$select_field.change();
          }
        } else {
          var option_name = context.$text_field.val().toLowerCase();
          var matching_option = { 'real-value': false };
          for (var i=0; i < context.options.length; i++) {
            if ( option_name === context.options[i]['label'].toLowerCase() ) {
              matching_option = context.options[i];
              break;
            }
          };
          if ( context.$select_field.val() !== matching_option['real-value'] ) {
            context.$select_field.val( matching_option['real-value'] || '' );
            context.$select_field.change();
          }
          if ( matching_option['real-value'] ) {
            context.$text_field.val( matching_option['label'] );

          }
          if ( typeof context.settings['handle_invalid_input'] === 'function' && context.$select_field.val() === '' ) {
            context.settings['handle_invalid_input']( context );
          }
        }
      }
      var widgetVisible = false;
      // jQuery UI autocomplete settings & behavior
      context.$text_field.autocomplete({
        'minLength': 0,
        'delay': 0,
        'autoFocus': true,
        position: { my : "left+150 top", at: "left bottom" },
        source: function( request, response ) {
          var filtered_options = filter_options( request.term );
          if ( context.settings['relevancy-sorting'] ) {
               filtered_options = bubbleSort(filtered_options);
               //filtered_options = filtered_options.sort( function( a, b ) { return b['relevancy-score'] - a['relevancy-score']; } );
          }
          response( filtered_options );
          if (request.term) {
            update_flag( filtered_options[0] );
          };
          context.settings['source']( request, filtered_options );
        },
        select: function( event, ui ) {
          update_select_value( ui.item );
          var filtered_options = [ui.item];
          update_flag( filtered_options[0] );
          context.settings['select']( event, ui );
        },
        open: function ( event, ui ) {
          widgetVisible = true;
        },
        close: function ( event, ui ) {
          widgetVisible = false;
        },
        change: function( event, ui ) {
          update_select_value( ui.item );
        },
        search: function (event, ui) {
        }
      }).data( "autocomplete" )._renderItem = function( ul, item ) {

        var map = [
            ['name',item.text],
            ['code',item.code],
            ['val',item.label],
            ['price',item.price],
            ['currency',context.settings['price-currency']],
            ['flag',context.settings['flags-dir']+item.flag],
        ];

        if (context.settings['contacts'] && (context.settings['contacts-renderer'].length > 0) && item.contact) {
            var renderedHTML = patternGenerator(context.settings['contacts-renderer'], map);
        } else {
            var renderedHTML = patternGenerator(context.settings['default-renderer'], map);
        }

        return $( "<li>" )
            .data( "item.autocomplete", item )
            .append( renderedHTML )
            .appendTo( ul );

      };
      // force refresh value of select field when form is submitted
      context.$text_field.parents('form:first').submit(function(){
        update_select_value();
      });
      // select current value
      update_select_value();

      // open full autocomplete when clicked on flag
      if (context.settings['flags']) {
          $(context.settings['flags-image-selector']).click(function () {
            if (widgetVisible) {
              context.$text_field.autocomplete( "close" );
            } else {
              context.$text_field.autocomplete( "search", "" );
              }
          });
      }
    }
  };

    function patternGenerator(pattern, mapvars) {
        var tokens = null;
        tokens = pattern.split('');
        var stack = [];

        while(tokens.length) {
            var token = tokens[0];
            if (token == "{") {
                tokens.shift();
                var search = [];
                do {
                    var selectedToken = tokens.shift();
                    search.push(selectedToken);
                    var token = tokens[0];
                } while (token != '}');
                tokens.shift();

                search = search.join('');

                // translate search to vars
                for (var i = 0; i < mapvars.length; i++)
                {
                    if(mapvars[i][0] == search) {
                        search = mapvars[i][1];
                    }
                }
                stack.push(search);
            } else {
                stack.push(tokens.shift());
            }
        }

        return stack.join('');
    }

  $.fn.selectToAutocomplete = function( method ) {
    if ( public_methods[method] ) {
      return public_methods[ method ].apply( this, Array.prototype.slice.call( arguments, 1 ));
    } else if ( typeof method === 'object' || ! method ) {
      return public_methods.init.apply( this, arguments );
    } else {
      $.error( 'Method ' +  method + ' does not exist on jQuery.fn.selectToAutocomplete' );
    }
  };

})(jQuery);
