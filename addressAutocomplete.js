;(function($, window, document, undefined) {
    function AutoComplete(el, options) {
       var  defaults = {
                noSuggestionNotice: '对不起暂不支持该地点',
                type: 'GET',
                dataType: 'local',
                searchTip: '支持中文、拼音、简拼输入',
                minChart: 1
            };
        this.options = $.extend({}, defaults, options);
        this.inputElement = el;
        this.$input = $(this.inputElement);
        this.dest_html = '<div class="dest_wrapper">\
            <div class="dft_dest" name="dft-dest">\
                <ul class="dft_title"></ul>\
                <div class="dft_list"></div>\
                <span name="tip" class="dest_tip">' + this.options.searchTip + '</span>\
            </div>\
            <div class="dest_result" name="dest-result">\
                <ul name="location-list" class="dest_list_ul"></ul>\
                <span name="msg" class="dest_msg">' + this.options.noSuggestionNotice + '</span>\
            </div>\
        </div>';

        this.dest_wrapper = $(this.dest_html).appendTo('body');
        this.dft_ul = this.dest_wrapper.find('[name="dft-dest"]').find('.dft_list');
        this.dft_title = this.dest_wrapper.find('[name="dft-dest"]').find('.dft_title');
        this.result_ul = this.dest_wrapper.find('[name="location-list"]');
        this.destId = 'dest_' + new Date().getTime();
        this.init();
    }

    AutoComplete.prototype = {
        init: function() {
            var that = this;
            
            this.dest_wrapper.click(function(e) {
                e.stopPropagation();
            });

            this.renderHotSuggestion();

            this.result_ul.on('click', '.has-flight, .flight-item', function(e) {//search list
                var $this = $(this);

                that.fillInput($this);

                that.dest_wrapper.children().eq(1).hide();
                that.dest_wrapper.hide();
                that.$input.trigger('schange');
            });
            
            // input event
            this.$input.unbind('blur').bind('blur', function(event) {

                if(that.dest_wrapper.children().get(1).style.display == 'block') {

                    if(that.result_ul.children().length <= 0) {
                        $(this).val('');
                    }else {
                        // that.result_ul.children().eq(0).click();
                        var $li = that.result_ul.children().eq(0);

                        that.fillInput($li);
                    }
                }
            });

            this.$input.unbind('click').bind('click', function(event) {
                event.stopPropagation();
                event.preventDefault();
                this.select();
                that.iptClick();
            });

            this.$input.unbind('keydown').bind('keydown', function(event) {
                event.stopPropagation();

                var c = event.keyCode;

                if (c == 38 || c == 40) {
                    event.stopPropagation();
                    
                    var type = c == 38 ? -1 : 1;
                    that.updown(type);
                } else return;
            });

            this.$input.unbind('keyup').bind('keyup', function(event) {
                var c = event.keyCode;

                if (c == 13 && $(this).is(':focus')) {
                    var $this = $(this),
                        the_dest = $('#' + $this.attr('data-dest'));
                    
                    that.enter();
                    return;
                } else if (c == 38 || c == 40) {
                    return;
                }
                that.searchKey(true);
            });
        },
        renderHotSuggestion: function() {
            var framentTag = '',
                framentContent = '',
                that = this;
            // render hot suggestion
            if(this.options.staticAddress) {
                // show '热门'
                for (var o in this.options.staticAddress) {
                    var item = this.options.staticAddress[o],
                        dft_dest = item.split('@'),
                        framentUl = '<ul class="' + (o == '热门' ? '' : 'hide') + '">',
                        dft_dest_count = dft_dest.length;

                    framentTag += '<li class="' +  (o == '热门' ? 'on' : '') + '">' + o + '</li>';

                    for (var i = 0; i < dft_dest_count; i++) {
                        if(i != 0)  {
                            var single = dft_dest[i].split('|');
                            framentUl += '<li cityId="' + single[0] + '" "><a href="javascript:;">' + single[1] + '</a></li>';
                        }
                    }

                    framentUl += '</ul>';
                    framentContent += framentUl;
                }
                this.dft_title.append(framentTag);
                this.dft_ul.append(framentContent);
            }else {
                this.dest_wrapper.find('[name="dft-dest"]').hide();
            }
            
            // add click handler
            this.dft_title.find('li').click(function() {//toggle tab
                var $this = $(this);

                $this.addClass('on').siblings('.on').removeClass('on');
                that.dft_ul.children('ul').hide().eq($this.index()).show();
            });

            this.dft_ul.find('li').click(function() {//select city
                var $this = $(this);

                that.$input
                .attr('cityId', $this.attr('cityId'))
                .val($this.text() + '(' + $this.attr('cityId') + ')')
                .trigger('schange');

                that.dest_wrapper.hide();
            });
        },
        iptClick: function() {
            this.position();
            $('.dest_wrapper').hide();
            this.dest_wrapper.show();
            this.dest_wrapper.children().eq(1).hide();
            this.dest_wrapper.children().eq(0).show();
        },
        position: function() {
            var _left = this.$input.offset().left,
                _top = this.$input.offset().top + this.$input.height();

            return this.dest_wrapper.css({
                left: _left,
                top: _top
            });
        },
        searchKey: function(flag) {
            var cur_vl = this.$input.val(),
                that = this;

            this.position().show();

            if (!cur_vl) {
                this.dest_wrapper.children(0).show().next().hide();
            } else {
                this.dest_wrapper.children(1).show().prev().hide();
                if (this.$input.attr('data-v') == cur_vl && !flag) {
                    return;
                } else {
                    this.$input.attr('data-v', cur_vl);
                    if(cur_vl.length >= this.options.minChart) {
                        if(this.options.dataType == 'local') {//本地取数据
                            this.searchLocalData(cur_vl);
                        }else if(this.options.serviceUrl) {
                            $.ajax({
                                url: this.options.serviceUrl,
                                type: this.options.type,
                                dataType: this.options.dataType,
                                data: {key: encodeURI(encodeURI(cur_vl))},
                                success: function(res) {
                                    if (res.Status != 0) {
                                        searchTip.html('查询失败').show();
                                        this.result_ul.hide();
                                        return;
                                    }
                                    that.process(res.Data);
                                }
                            })
                        }
                    } else {
                        $('.dest_wrapper').hide();
                    }
                }
            }
        },
        updown: function(type) {           
            //press ↓
            if (type == 1) {
                var result_list = this.result_ul;

                if (result_list.children().length == 0) {
                    return;
                } else {
                    var li_on = result_list.children('.on');

                    if (li_on.length > 0) {
                        if (!this.dest_wrapper.is(':visible')) {
                            this.dest_wrapper.show();
                        } else {
                            var sibling = li_on.next();

                            while(sibling.hasClass('no-flight')) {
                                sibling = sibling.next();
                            }

                            li_on.removeClass('on');
                            if (sibling.length > 0)
                                sibling.addClass('on');
                            else
                                result_list.children().eq(0).addClass('on');
                        }
                    } else {
                        result_list.children().eq(0).addClass('on');
                    }
                }
            }
            
            //press ↑
            else {
                var result_list = this.result_ul;;

                if (result_list.children().length == 0) {
                    return;
                } else {
                    var li_on = result_list.children('.on');

                    if (li_on.length > 0) {
                        var sibling = li_on.prev();

                        while(sibling.hasClass('no-flight')) {
                            sibling = sibling.prev();
                        }

                        li_on.removeClass('on');
                        if (sibling.length > 0)
                            sibling.addClass('on');
                        else
                            result_list.children().eq(result_list.children().length - 1).addClass('on');
                    } else {
                        result_list.children().eq(0).addClass('on');
                    }
                }
            }
        },
        searchLocalData: function(key) {
            var dataLen = this.options.localData.length,
                i = 0,
                pattern = '(^' + this.escapeRegExChars(key) + ')',
                reg = new RegExp(pattern, 'i'),
                mapData = [];

            for(i; i < dataLen; i++) {
                var item = this.options.localData[i];
                // 名字、简拼、拼音、三字码
                if(reg.test(item.Name) || reg.test(item.Spell) || reg.test(item.ShortSpell) || reg.test(item.Code)) {
                    mapData.push(item);
                }
            }
            this.process(mapData);
        },
        escapeRegExChars: function(value) {
            return value.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
        },
        formatResult: function(suggestion, currentValue) {
            var pattern = '(' + this.escapeRegExChars(currentValue) + ')',
                displayResult = suggestion.Name,
                reg = new RegExp(pattern, 'gi');
            
            if(reg.test(suggestion.ShortSpell)) {
                displayResult += '(' + suggestion.ShortSpell + ')';
            }else if(reg.test(suggestion.Code)) {
                displayResult += '(' + suggestion.Code + ')';
            }else if(reg.test(suggestion.Spell)) {
                displayResult += '(' + suggestion.Spell + ')';
            }else if(reg.test(suggestion.Name)) {
                displayResult = suggestion.Name;
            }
            return displayResult.replace(reg, '<strong>$1<\/strong>');
        },
        fillInput: function($elem) {
            if($elem.hasClass('flight-item')) {//附近机场
                var liVal = '';
                $elem.children('span').each(function(i){
                    if(i != 0) {
                        liVal += '(' + $(this).text() + ')';
                    }else {
                        liVal += $(this).text();
                    }
                })
                this.$input.val(liVal + '(' + ($elem.attr('code') || '') + ')')
            }else {
                this.$input.val($elem.text().split('(')[0] + '(' + ($elem.attr('code') || '') + ')')
            }

        },
        process: function(data) {
            var  searchTip =  this.dest_wrapper.find('[name="msg"]'),framentUl = '';
            this.result_ul.empty();

            if (data.length <= 0) {
                searchTip.html(this.noSuggestionNotice).show();
                this.result_ul.hide();
                return;
            } else {
                var searchVal = this.$input.val(),
                    dataCount = data.length;
                this.result_ul.show(100);
                searchTip.hide();

                for(var i = 0; i < dataCount; i++) {

                    if(data[i].Datas) {//本城市无机场
                         framentUl += '<li class="no-flight" code="' + data[i].Code + '">' + this.formatResult(data[i], searchVal) + ' -该城市无机场</li>';
                        var flightCount = data[i].Datas.length;

                        for(var j = 0; j < flightCount; j++) {
                            framentUl += '<li class="flight-item" code="'+ (data[i].Datas[j].Code || '') + '">邻近机场：';

                            framentUl += getFlightName(data[i].Datas[j]) + '-'+  (data[i].Datas[j].Dist || '') + '公里</li>';
                        }
                    }else {
                        framentUl += '<li class="has-flight"code="' + data[i].Code + '">' + this.formatResult(data[i], searchVal) + '</li>';
                    }
                }

                this.result_ul.append(framentUl);

                function getFlightName(flightData) {
                    var flightHtml = ''
                    if(flightData.Datas && flightData.Datas.length > 0) {//附近机场
                        var flightCount = flightData.Datas.length;
                        for(var j = 0; j < flightCount; j++) {
                            flightHtml += getFlightName(flightData.Datas[j]) + ' ';
                        }
                    }
                    flightHtml += '<span>' + flightData.Name + '</span>';
                    return flightHtml;
                }
            }
        },
        enter: function() {
            var li_on = this.result_ul.children('.on');

            if (li_on.length == 0) return;
            
            li_on.click();
        }
    };

    $.fn.autoComplete = function(options) {
        $(document).click(function() {
            $('.dest_wrapper').hide();
        });
        return this.each(function() {
            if(!$.data(this, 'autocomplete')) {
                $.data(this, 'autocomplete', new AutoComplete(this, options));
            }
        });
    };

})(jQuery, window, document);
