'use strict';
/* listen before concert*/

//youtube player js
var tag = document.createElement('script');

tag.src = 'https://www.youtube.com/iframe_api';
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
var player;

function onYouTubeIframeAPIReady() {
	player = new YT.Player('UtubePlayer', {
		height: '100%',
		width: '100%',
		//videoId: 'M7lc1UVf-VE',
		//wmode: 'transparent',
		playerVars: {
			'controls': 2, //change youtube controls bar 
			'autohide': 1, //auto hide contral bar
			'theme': 'dark',
			'color': 'white',
			'wmode': 'transparent',
			'rel': 0

		},
		events: {
			'onReady': onPlayerReady,
			'onStateChange': onPlayerStateChange
		}
	});
	//to do list ,set to hight quality
	//player.setPlaybackQuality('hd720'); 
}

function onPlayerReady(event) {

	//event.target.playVideo();
}


function onPlayerStateChange(event) {
	// if (event.data == YT.PlayerState.PLAYING && !done) {
	// 	setTimeout(stopVideo, 6000);
	// 	done = true;
	// }
}

function stopVideo() {
	player.stopVideo();
}
//youtube player js end

//to do list
/*

// 4.try to aviod one erroe crash while the app ...done
//11. replace '  to %27 word before search--- .replace(/'/g,'') ...done
//12 .The Rolling Stones  first one abnum issues ,find it.....done
//13. delete space of input  ....done
//14.let use delete......done
//15.if no artist shake it...done
// 7.draw some ui ,see mySpace ....done
// 8. put artist image to the collect....done

// 1.videoId remove those no-result
// 3.remove those album without track
// 5.complate % to hint user
// 2.remember mobile version,change playlist way
// 9.play album by album and play artist by artist
//10.find video search issues about undefined
//16.svg
//17.current play
//18.logo
//6.try to use localstorge
//19.fix bowers issues
//20.change database
//21. html5 player refine
*/
/* ui remider
//1. click artist ,slide to album  ,there are two button on top ,one is back button ,another is play mode or play



*/



$(function() {

	//namespace

	window.App = {
		Models: {},
		Collections: {},
		Views: {}
	};

	window.template = function(id) {
		return _.template($('#'+id).html());
	};


	//keys --use your own key

	var gooogle_key = '';
	var lastfm_key = '';

	//event holder
	var vent = _.extend({}, Backbone.Events);
	var currentAlbumList; //for point to current Albumlist
	var albumListAll = {};

	//test data
	var showOutNum = '10';
	var searchkey = 'Stars'; //Model
	var searchMbid= '16ebb731-7ba0-4dc0-ad87-ef4c56461d81';  //for stars
	var prePageNu = '1'; //for video search
     
    //exu Album
	var trackArry = [];

	var trackFinishNum = 0;
	var totleFetchVideoNum = 0;

	// var albumlist = new AlbumList({

	// })



	var temptrFetchNum = 0;

	//for artist image model
	App.Models.ArtistImage = Backbone.Model.extend({


		url: function() {
			//for find artist use
			return 'http://ws.audioscrobbler.com/2.0/?method=artist.search&artist=' + searchkey + '&api_key=' + lastfm_key + '&format=json';
		},

		parse: function(response) {
			var _response = {};
			response = response.results.artistmatches.artist[0];
			_response.artistImage = response.image[2]['#text'];
			_response.artistMbid = response.mbid;
			_response.artistName = response.name;
			return _response;

		}
	});

	//get artist name
	App.Models.ArtistName = Backbone.Model.extend({


		parse: function(response) {

			var _response = {};
			//_response.artistImage = response.image[2]['#text'];			
			_response.artistMbid = response.mbid;
			_response.artistName = response.name;
			return _response;

		}
	});


	//Album Model
	App.Models.Album = Backbone.Model.extend({
		parse: function(response) {

			//delete some info for response
			var _response = {};
			// // console.log('response=',response);
			_response.albumName = response.name; //get album name
			_response.albumMbid = response.mbid; // get album mbid
			_response.albumCover = response.image[3]['#text']; //get medium thumbnal medium url

			_response.artistName = response.artist.name; //rename description
			_response.albumNumber = response.albumNumber;

			return _response;
		}

	});

	App.Models.Track = Backbone.Model.extend({

		parse: function(response) {


			var tempTrackName = [];

			//last.fm 資料不整齊 所需處理tracks 裡面物件
			if (typeof(response.album.tracks.track) != 'undefined') {

				for (var i = 0; i < response.album.tracks.track.length; i++) {
					tempTrackName.push({
						'name': response.album.tracks.track[i].name
					});
				}
			} else {
				for (var i = 0; i < response.album.tracks.length; i++) {
					tempTrackName.push({
						'name': response.album.tracks[i].name
					});
				}

			}
			response.tracks = tempTrackName;
			response.releasedate = response.album.releasedate;

			return response;

		},
		url: function() {

			//if it's with album mbid use mbid, for use name
			if (this.get('albumMbid') !== '') {
				return 'http://ws.audioscrobbler.com/2.0/?method=album.getinfo&api_key=' + lastfm_key + '&mbid=' + this.get('albumMbid') + '&format=json';

			} else {
				return 'http://ws.audioscrobbler.com/2.0/?method=album.getinfo&api_key=' + lastfm_key + '&artist=' + encodeURI(this.get('artistName')) + '&album=' + encodeURI(this.get('albumName')) + '&format=json';

			}

		},
		initialize: function() {

			//vent.on('combinealbum', this.combineAlbum, this);
			// // console.log('albumName:', this.get('albumName'));
			// // console.log('albummbid=', this.get('albumMbid'));
		}

	});

	App.Models.VideoSearch = Backbone.Model.extend({

		parse: function(response) {
			response = response.items[0];
			// console.debug('video search response=', response);
			var _response = {};
			_response.videoId = response.id.videoId;
			_response.thumbnail = response.snippet.thumbnails.medium.url; //get medium thumbnal medium url
			_response.videoTitle = response.snippet.title;

			return _response;
		},

		url: function() {

			//try to eascpe ' sign

			var _artistName = decodeURIComponent(this.get('artistName')).replace(/'/g, '');
			var _trackName = decodeURIComponent(this.get('trackName')).replace(/'/g, '');

			// console.debug(_artistName, '-', _trackName);
			return 'https://www.googleapis.com/youtube/v3/search?part=snippet&q=' + _artistName + _trackName + '&maxResults=' + prePageNu + '&key=' + gooogle_key;

		},
		initialize: function() {

			//this.deferred = this.fetch();			

		}



	});

	//artist collection for localstorage

	App.Collections.Artist = Backbone.Collection.extend({
		model: App.Models.ArtistImage,


		safe: {
			key: 'artist.list',
			options: {
				reload: true
			}
		},
		initialize: function() {

			vent.on('fetch.artistImage', this.fetchArtistImage, this);

		},
		test: function() {

			artistImage.fetch({
				success: function() {
					artistImage.save();
					thisCollection.add(artistImage);
					// console.log('try localstorage', artistImage)
				}

			});

		},
		fetchArtistImage: function() {


			var thisCollection = this;
			var artistImage = new App.Models.ArtistImage ({});
			var artistModelImage;
			artistImage.fetch({

				success: function(model) {

					var thisModel = model;

					thisModel.save();
					thisCollection.add(thisModel);


					//make sure the same name with album collection
					if (thisModel.get('artistName').toLowerCase() != currentAlbumList.at(0).get('artistName').toLowerCase()) {

						var tempImageModel = new App.Models.ArtistImage ({
							artistName: currentAlbumList.at(0).get('artistName'),
							artistImage: currentAlbumList.at(0).get('albumCover')

						});

						artistModelImage = tempImageModel.get('artistImage');
						currentAlbumList.artistImage = artistModelImage;

						var artistItemView = new App.Views.ArtistItem({

							model: tempImageModel

						});

					} else {

						artistModelImage = thisModel.get('artistImage');
						currentAlbumList.artistImage = artistModelImage;


						var artistItemView = new App.Views.ArtistItem({
							model: thisModel
						});
					}

					//$('.artist-catalogue-list > li.on > a').append('<img src=''+artistModelImage+'' >');


					//calc images width and height
				}
			});

		}



	});

	App.Collections.ArtistName = Backbone.Collection.extend({
		model: App.Models.ArtistName,
		url: function() {
			//limit 5	..&limit=5
			return 'http://ws.audioscrobbler.com/2.0/?method=artist.search&artist=' + searchkey + '&api_key=' + lastfm_key + '&format=json';
		},
		parse: function(response) {


			var resp = response.results.artistmatches.artist;
			//filter those without mbid
			resp = _.filter(resp, function(resp) {
				return resp.mbid !== '';
			});
			return resp;

		}


	});


	App.Collections.Album = Backbone.Collection.extend({
		model: App.Models.Album,
		url: function() {

			//return 'http://ws.audioscrobbler.com/2.0/?method=artist.gettopalbums&artist=' + searchkey + '&api_key='+lastfm_key+'&format=json'		

			return 'http://ws.audioscrobbler.com/2.0/?method=artist.gettopalbums&artist=' + searchkey + '&autocorrect=1&api_key=' + lastfm_key + '&format=json';


		},

		parse: function(response) {

			var temp_rep = [];


			for (var i = 0; i < response.topalbums.album.length; i++) {

				//remove without album mbid
				if (response.topalbums.album[i].mbid !== '') {

					temp_rep.push(response.topalbums.album[i]);

				}

			}

			//add albumNumber

			for (var k = 0; k < temp_rep.length; k++) {
				temp_rep[k].albumNumber = k;
			}


			return temp_rep;
		},
		initialize: function() {
			Backbone.Safe.create(searchkey, this);
			vent.on('fetch.track', this.startFetchTrack, this); //listen fetch track event
			this.once('remove.artist', this.handelRemoveArtist, this);
			this.safe.reload();
			//vent.on('remove.artist',this.handelRemoveArtist,this);
		},
		handelRemoveArtist: function(arg) {
			// console.log('remove this=', this, arg);

			if (this.at(0).get('artistName').toLowerCase() == arg) {

				// console.log(this.at(0).get('artistName').toLowerCase(), arg);

				//vent.off('remove.artist',this.handelRemoveArtist);   ///// have problem
				delete this.artistImage;
				this.reset();

				//this.unbind();
				//this.remove();
			}

		},

		startFetchTrack: function() {

			//// console.log('startFetchTrack run');
			var thisCollection = this;

			for (var i = 0; i < thisCollection.length; i++) {

				//var temptr = eval('var tracklist' + i);

				var tracklist = new App.Models.Track({
					artistName: thisCollection.at(i).get('artistName'),
					albumName: thisCollection.at(i).get('albumName'),
					albumMbid: thisCollection.at(i).get('albumMbid'),
					albumNumber: i
				});



				trackArry.push(tracklist);
				tracklist.fetch({
					//when success combine the tracks data to albumlist 1 by 1
					success: function(model) {
						_albumNumber = model.get('albumNumber');
						thisCollection.at(_albumNumber).set('tracks', model.get('tracks'));
						thisCollection.at(_albumNumber).set('releaseDate', model.get('releasedate'));
						thisCollection.at(_albumNumber).trigger('viewAdd.relaseDate');

					}
				});
			}
		}

	});


	//album Model view

	App.Views.AlbumItem = Backbone.View.extend({
		tagName: 'li',
		className: 'album-item',
		template: template('album-item-template'),
		initialize: function() {
			this.render(); //when it build ,it render
			//vent.on('viewAdd.relaseDate',this.addRelaseDate,this);  //too many time

			this.model.once('viewAdd.relaseDate', this.addRelaseDate, this);
		},
		events: {
			'click': 'clickVideo'

		},

		render: function() {
			this.$el.html(this.template(this.model.toJSON()));

		},

		addRelaseDate: function() {

			if (typeof(this.model.get('releaseDate')) != 'undefined') {

				//only get year  ---19 Nov 2007, 00:00
				var _year = this.model.get('releaseDate');
				var _sliceNum = _year.indexOf(',');
				_year = _year.slice(_sliceNum - 4, _sliceNum);
				this.$el.find('.album-time').html(_year); //add release Date
				//vent.off('viewAdd.relaseDate');
			}
		},
		clickVideo: function() {

			//when click album item do something


			// // console.log('View model=', this.model,'View=', this);
			// // console.log('AlbumItemView model albumNumber=', this.model.get('albumNumber'));
			this.$el.parent('.album-item-list').find('.is-playing').removeClass('is-playing');
			this.$el.addClass('is-playing');

			// search which album track and play
			vent.trigger('click.album', this.model.get('albumNumber'));
			seacrchYoutubeVideo(this.model.get('albumNumber'));

		}
	});



	App.Views.Search = Backbone.View.extend({
		el: '.search-wrap',
		events: {
			'keypress :input': 'searchKeyDown',
			'click .back-but': 'backClick',
			'input :input': 'searchAutoComplate'
		},
		initialize: function() {
			var thisView = this;

			vent.on('layout.clearInput', this.clearInput, this);
			vent.on('layout.disable.search', this.disableInput, this);
			vent.on('layout.enable.search', this.ebableInput, this);

			//this.$el.on('transitionend webkitTransitionEnd oTransitionEnd otransitionend MSTransitionEnd',this.resetShake,this)
			this.$el.on('webkitAnimationEnd oanimationend msAnimationEnd animationend', this.resetShake, _.bind(this.resetShake, this));
			// this.$el.on('webkitAnimationEnd oanimationend msAnimationEnd animationend',function(e){
			// 	// console.log('removed shake',e.animationName);
			// 	$('#artist-search').removeClass('error-shake');
			// });
		},
		render: function() {


			//draw each model in collection
			this.collection.each(function(artistItem) {
				var artist = new App.Views.ArtistName({
					model: artistItem
				});

				//append to el			
				this.$el.find('#artist-name-list').append(artist.el);
				//// console.log('this.$el=',this.$el.find('#artist-name-list').append(artist.el));
			}, this);
		},
		searchKeyDown: function(e) {

			if (e.keyCode == 13) {

				e.preventDefault();



				// if (this.$el.hasClass('unlock')) { //remove unlock

					searchkey = this.$('#artist-search').val().trim().toLowerCase(); //input search key and trim

					if (typeof(albumListAll[searchkey]) == 'undefined') {

						vent.trigger('search.reinput');


					} else {
						vent.trigger('click.artist', searchkey); //jump to this artist

					}
				// } 
				// else {

				// 	if (this.$('#artist-search').val() == '777') {

				// 		this.$el.addClass('unlock');
				// 		this.clearInput();
				// 		//show some thing 
				// 		// console.log('???', this.$('#artist-search').val());

				// 	} else {
				// 		this.$('#artist-search').addClass('error-shake');
				// 	}



				// }


			}
		},
		backClick: function(e) {

			vent.trigger('layout.showArtist');

		},
		searchAutoComplate: function(e) {

			// if (this.$el.hasClass('unlock')) { //remove unlock
				var thisView = this;
				var val = $(e.currentTarget).val();

				searchkey = val;

				if (val.length >= 4) {

					this.collection.fetch().done(function() {
						thisView.$el.find('#artist-name-list').html(''); //empty option
						thisView.render();
					});
					

				}
			// }

		},
		resetShake: function(e) {
			// console.log('resetShake', 'animationName=', e.originalEvent.animationName);
			//if(e.animationName == 'shake' && e.type.toLowerCase().indexOf('animationend') >= 0){
			if (e.originalEvent.animationName == 'shake') {
				$('#artist-search').removeClass('error-shake');
			}

			//}

		},
		disableInput: function() {
			this.$('#artist-search').attr('disabled', true).attr('placeholder', 'no more than 5');
		},
		ebableInput: function() {

			this.$('#artist-search').removeAttr('disabled', false).attr('placeholder', 'artist or band...');
		},
		clearInput: function() {

			this.$('#artist-search').val(''); //reset input

		}
	});



	App.Views.ArtistName = Backbone.View.extend({
		//use html5 autocomplete 
		tagName: 'option',

		render: function() {

			this.$el.html(this.model.toJSON());
			this.$el.attr('value', this.model.get('artistName'));
		},
		initialize: function() {
			this.render(); //when it build ,it render
		}

	});


	App.Views.Album = Backbone.View.extend({

		el: '#album-item-wrap',

		render: function() {

			//draw each model in collection
			this.collection.each(function(videoitem) {
				var video = new App.Views.AlbumItem({
					model: videoitem
				});
				video.addRelaseDate(); //add year;
				//append to el
				this.$el.find('.album-item-list').append(video.el);
			}, this);
		},
		events: {
			'mousewheel': 'scrollAlbum'
		},
		initialize: function() {

			var thisView = this;

			//listion event
			vent.on('search.reinput', this.drawMusic, this); //liston for  resarch event
			vent.on('click.artist', this.reDrawAlbum, this); //listion for click artist event
			vent.on('click.album', this.clickAlbum, this);
			vent.on('remove.artist', this.handelRemoveArtist, this);
			//vent.on('layout.showAlbum',this.slideIn, this);


			// this.collection.fetch().done(function(res) {
			// 	thisView.render(); //view render first
			// 	//member this collection
			// 	var currentArtist=thisView.collection.at(0).get('artistName').toLowerCase(); //get artist Name for recode it
			// 	albumListAll[currentArtist]=thisView.collection;//push albumlist in all
			// 	fetchArtistImage(searchkey, albumListAll[currentArtist]);  //draw artist image
			// 	vent.trigger('startFetchTrack'); //trigger fetch track

			// })
			//this.drawMusic();

		},
		scrollAlbum: function(e) {

			//wheelDelta			
			var delta = e.originalEvent.wheelDelta;
			var _target = this.$el.find('.album-scroll');
			_targetTop = parseInt(_target.css('top'));
			_maxHeight = $('.album-scroll').height() - $('#album-item-wrap').height() + 20;
			if ((_targetTop <= 0 && delta > 0) || (_targetTop >= (_maxHeight * -1)) && delta < 0) {
				_target.css({
					'top': delta + _targetTop + 'px'
				});

				if (parseInt(_target.css('top')) > 0) {
					_target.css({
						'top': 0
					});
				} else if (parseInt(_target.css('top')) < (_maxHeight * -1)) {
					_target.css({
						'top': _maxHeight * -1 + 'px'
					});

				}
			}

		},

		//this function for research another artist
		drawMusic: function() {

			var thisView = this;
			thisView.$el.find('.album-item-list').html(''); //empty html for new content


			this.collection = new App.Collections.Album({}); // new albumlist collection

			var thisCollection = thisView.collection;


			thisCollection.fetch().done(function() {


				thisView.$el.removeClass('is-playing').find('.album-scroll').css({
					'top': 0
				}).find('.line-inner').css({
					'bottom': '100%'
				}); //reset top //reset top
				thisView.render(); //view render first
				//member this collection
				var currentArtist = thisCollection.at(0).get('artistName').toLowerCase(); //get artist Name for recode it
				albumListAll[currentArtist] = thisCollection; //push albumlist in all
				currentAlbumList = thisCollection; //current Albumlist
				vent.trigger('fetch.artistImage');
				//fetchArtistImage(searchkey, thisCollection); //find artist images  maksure collection isn't undefind 
				vent.trigger('layout.clearInput'); //clear input
				vent.trigger('fetch.track'); //will crash the app

			}).fail(function(resp) {
				// console.log('collection.fetch fail', 'resp=', resp);

			});

		},
		clickAlbum: function(arg) {

			var _totalLenght = this.$el.find('.album-item-list .album-item').size();
			var _percent = ((100 - (1 / _totalLenght) * 100 * (arg))) + '%';
			var _line = this.$el.find('.line-inner');
			var _bottom = 'calc(' + _percent + ' - 5rem)';
			//var _bottom=_percent;

			_line.css({
				'bottom': _bottom
			});
			this.$el.addClass('is-playing');


		},

		reDrawAlbum: function(arg) {

			var thisView = this;


			if (albumListAll[arg] != currentAlbumList) {


				this.$el.find('.album-item-list').html(''); //empty html for new content

				//// console.log('arg=',arg);


				this.collection = albumListAll[arg]; // find collection in object
				currentAlbumList = albumListAll[arg]; //current collect
				this.$el.removeClass('is-playing').find('.album-scroll').css({
					'top': 0
				}).find('.line-inner').css({
					'bottom': '100%'
				}); //reset top
				this.render(); //redraw
			}
		},
		handelRemoveArtist: function(arg) {
			// console.log('arg', arg);
			if (albumListAll[arg] == this.collection) {

				//// console.log('bingo');
				//this.collection.trigger('remove.artist'); //collection tigger remove event

				this.$el.find('.album-item-list').html('');
				this.$el.removeClass('is-playing').find('.album-scroll').css({
					'top': 0
				}).find('.line-inner').css({
					'bottom': '100%'
				}); //reset top
				//to do list------ reset line
			}


		}

	});

	App.Views.ArtistItem = Backbone.View.extend({
		tagName: 'li',
		className: 'artist-item',
		template: template('search-item-templete'),
		initialize: function() {

			this.render(); //when it build ,it render
		},
		events: {
			'click .artist-but': 'artistClick',
			'click .artist-remove': 'removeArtist'
		},
		render: function() {

			var renderEl = this.$el.html(this.template(this.model.toJSON()));
			vent.trigger('layout.addArtist', renderEl);
		},

		artistClick: function(e) {
			//to do list---add artist click slide event
			vent.trigger('click.artist', this.model.get('artistName').toLowerCase());
			vent.trigger('layout.showAlbum');
		},
		removeArtist: function() {

			var whichCollectionKey = this.model.get('artistName').toLowerCase();
			vent.trigger('remove.artist', whichCollectionKey);
			albumListAll[whichCollectionKey].trigger('remove.artist', whichCollectionKey);
			
			delete albumListAll[whichCollectionKey];
			this.unbind();
			this.remove();
			vent.trigger('remove.artist.Lenght');
		}

	});



	App.Views.Artist= Backbone.View.extend({
		el: '.artist-wrap',
		collection: new App.Collections.Artist({}),

		initialize: function() {

			vent.on('layout.addArtist', this.addArtist, this);
			vent.on('get.artistLenght', this.artistLenght, this);
			vent.on('remove.artist.Lenght', this.removeArtist, this);
			this.collection.create({});



		},
		addArtist: function(arg) {


			this.$el.find('.artist-catalogue-list').prepend(arg);
			var _target = this.$el.find('.artist-catalogue-list .artist-item:eq(0)');
			var _targetImg = _target.find('img');

			_targetImg.load(function() {
				//thisEl.addClass('fade-in'); //fade in image	....not work well		
				if (_targetImg.height() > _targetImg.width()) {
					_target.find('.artist-thumb').addClass('is-tall');
				}
			});

			//check if amount of artist more than 5 
			// console.log('this.artistLenght=', this.artistLenght());

			if (this.artistLenght() >= 5) {

				vent.trigger('layout.disable.search');


			}

		},
		removeArtist: function() {

			// console.log('remove arg=', '-', this.artistLenght());
			if (this.artistLenght() < 5) {
				//// console.log('remove arg= >5',this.artistLenght());
				vent.trigger('layout.enable.search');

			}

		},
		artistLenght: function() {

			return this.$el.find('.artist-item').length;

		}
	});


	App.Views.UI = Backbone.View.extend({
		el: '#ui-layer',

		initialize: function() {

			var thisView = this;

			vent.on('layout.showAlbum', this.showAlbum, this);
			vent.on('layout.showArtist', this.showArtist, this);

			//for body event to show or hide UI
			$('body').on('mouseleave', this.hideUI, _.bind(this.hideUI, this));
			$('body').on('mouseenter', this.showUI, _.bind(this.showUI, this));
			this.$el.on('webkitAnimationEnd oanimationend msAnimationEnd animationend', this.offAlbum, _.bind(this.offAlbum, this));


		},
		showAlbum: function() {
			var thisEl = this.$el;
			thisEl.find('#album-item-wrap').removeClass('is-hide'); //display album
			thisEl.removeClass('show-artist').addClass('show-album');
		},
		showArtist: function() {
			var thisEl = this.$el;
			thisEl.removeClass('show-album').addClass('show-artist');


		},
		offAlbum: function(e) {

			if (e.originalEvent.animationName == 'album-slide-out') {
				// console.log('offAlbum', 'e=', e);
				this.$el.find('#album-item-wrap').addClass('is-hide'); //hide album when animate finish
			}
		},


		showUI: function() {

			var thisEl = this.$el;
			//for the first time ,without any class
			if ( !! thisEl.hasClass('slide-out')) {
				thisEl.removeClass('slide-out').addClass('slide-in');

			}


		},


		hideUI: function() {

			this.$el.removeClass('slide-in').addClass('slide-out');

		}



	});




    function seacrchYoutubeVideo(albumNum) {

		var totalTrackNum = currentAlbumList.at(albumNum).attributes.tracks.length;
		var deferredArry = [];

		for (var i = 0; i < totalTrackNum; i++) {

			var tempVideoSearch = new App.Models.VideoSearch({
				artistName: currentAlbumList.at(albumNum).get('artistName'),
				trackName: currentAlbumList.at(albumNum).attributes.tracks[i].name,
				albumNumber: albumNum, //remrmber whcih album
				trackNum: i //remember which track
			});



			deferredArry.push(tempVideoSearch.fetch({
				success: function(model) {

					var _albumNumber = model.get('albumNumber');
					var _trackNum = model.get('trackNum');
					var whichTrack = currentAlbumList.at(_albumNumber).attributes.tracks[_trackNum];
					whichTrack.videoId = model.get('videoId');
					whichTrack.videoThumbnail = model.get('thumbnail');

				}

				// 		totleFetchVideoNum++;

				// 		if (totleFetchVideoNum >= totalTrackNum) {

				// 			var tempTracks = [];
				// 			for (var i = 0; i < currentAlbumList.at(_albumNumber).get('tracks').length; i++) {
				// 				tempTracks.push(currentAlbumList.at(_albumNumber).get('tracks')[i].videoId);
				// 			}
				// 			// console.log('ok to play,videoid=', tempTracks);
				// 			//play a playlist
				// 			player.loadPlaylist(tempTracks);

				// 			// reset totleFetchVideoNum
				// 			totleFetchVideoNum = 0;


				// 		}

			}));


		}

		//all deffered and run player

		$.when.apply($, deferredArry).done(function() {

			var tempTracks = [];
			for (var i = 0; i < currentAlbumList.at(albumNum).get('tracks').length; i++) {

				tempTracks.push(currentAlbumList.at(albumNum).get('tracks')[i].videoId);
			}

			//play a playlist
			player.loadPlaylist(tempTracks,0);



		});



	}

	var albumView = new App.Views.Album({
		
	});
	

	var searchView = new App.Views.Search({
		collection: new App.Collections.ArtistName({})
	});

	var artistListView = new App.Views.Artist({

	});

	var uiView = new App.Views.UI({

	});

	//current album collection

	currentAlbumList = albumView.collection;



});



/*

$('.myClass').on('transitionend webkitTransitionEnd oTransitionEnd otransitionend MSTransitionEnd', 
function() {
 //do something
});


$('#animate').bind('cssAnimationKeyframe', function(event){
	switch(event.originalEvent.keyText) {
		case '0%':
			
			break;
		case '25%':
			
			break;
		case '50%':
			
			break;
		case '75%':
			
			break;
		case '100%':
			 
			break;
	};
});
*/