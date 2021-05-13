// Load Sidebar
load_requires('sidebar');
load_requires('modal');
var current_page = "";
const api_url = "http://dgb.local";
var last_url = "";
$(document).ready(function() {
	var d = new Date();
	var year = d.getFullYear();
	$('#footer_to_date').text(year);
	$("#first_load_page").trigger('click');

	displayDateTime();

});

function displayDateTime() {
	var el = $("#head_date_time");
	setInterval(function() {
		var date = moment().format("dddd, MMMM DD, YYYY hh:mm:ss A");
		el.html(date);
	}, 1000);
	
}

$(document).on('click', '.reset_btn', function(evt) {
	var self = $(this);
	var modal = self.data('modal');
	functions.closeModal($("#" + modal));
	functions.clearInputs($("#" + modal));
});

$(document).on('keypress', '.number_only', function(evt) {
	var charCode = (evt.which) ? evt.which : event.keyCode

	if ( charCode > 31 && (charCode < 48 || charCode > 57) ) {
		return false;
	}

	return true;
});

$(document).on('keypress', '.number_with_plus', function(evt) {
	var charCode = (evt.which) ? evt.which : event.keyCode

	if ( charCode == 43 ) {
		return true;
	}

	if ( charCode > 31 && (charCode < 48 || charCode > 57) ) {
		return false;
	}

	return true;
});

$(document).on('keypress', '.number_with_dot', function(evt) {
	var charCode = (evt.which) ? evt.which : event.keyCode

	if ( charCode == 46 ) {
		return true;
	}

	if ( charCode == 44 ) {
		return true;
	}

	if ( charCode > 31 && (charCode < 48 || charCode > 57) ) {
		return false;
	}

	return true;
});

$(document).on('submit', "#confirm_form", function(evt) {
	functions.preventDefault(evt);
	var self = $(this);
	var button = self.find('.btn_delete');
	var func = button.data("func");

	functions.api_call({
		type : "POST",
		url : self.attr('action'),
		data : self.serialize()
	}).done(function(data) {

		if ( data.res.success ) {
			functions.toast({
				heading : "Success!",
				message : data.res.message,
				icon : "success",
				loader : false,
				loaderBg : "green",
				position : 'top-right'
			});
			$("#" + func).submit();
			self.children("#delete_inputs").empty();
			self.attr('action', '');
			button.find('btn_delete').data('func', '');
		} else {
			functionstoast({
				heading : "Error!",
				message : data.res.message,
				icon : "error",
				loader : false,
				loaderBg : "red",
				position : 'top-right'
			});
		}

	}).always(function() {
		$("#confirm_modal").modal('hide');
	});

})


$(document).on('click', '.open_page', function(evt) {
	evt.preventDefault();
	var self = $(this);
	var page = self.data('page');
	functions.showHideLoader();
	load_html(page);
});

$(document).on('click', '.open_modal', function(evt) {
	evt.preventDefault();
	var self = $(this);
	var delay = self.data('delay') ? self.data('delay') : 500;
	var target = self.data('target');
	var head_title = self.data('head');
	var header = $("#" + target + "_modal").find('.modal_header');
	header.html(head_title);
	$("#" + target + "_modal").find('form').find('.staff-buttons').children('.save_new_btn').removeClass('hide_el');

	if ( target == "new_holiday" ) {
		functions.toDatePicker($("#holiday_date_picker"));
	}

	setTimeout(function() {
		functions.loadModal(target);
	}, delay);
		
});

$(document).on('click', '.page-link', function(evt) {
	functions.preventDefault(evt);
	var self = $(this);
	var parent = self.parents('#js-pagination');
	var form = $("#" + parent.data('form'));
	var page = self.data('next_page');
	form.find('input[name="page"]').val(page);
	form.submit();
});

$(document).on('click', '.js-search', function(evt) {
	var self = $(this);
	var form = self.parents('form');
	form.find('input[name="page"]').val('1');
});

$(document).on('keypress', '.flatpickr', function(evt) {
	return false;
});

function load_html(page) {
	$.get({
		url: "pages/" + page + ".html", 
		dataType : 'html',
		cache: false,
	}, function(data) {
		$('#page_container').empty();
		$('#page_container').html(data);
		loadData(page)
		setTimeout(function() {
			functions.showHideLoader(false);
		}, 1000)
	});
}

function loadData(page) {
	switch(page) {
		case 'employee' :
			current_page = "Employee → Search/List";
			break;
		case 'attendance':
			current_page = "Attendance";
			get_employees();
			break;
		case 'designation':
			current_page = "Designation → Search/List";
			break;
		case 'holiday':
			current_page = "Holidays → Search/List";
			break;
		default:
			current_page = "Dashboard"
			break;
	}
	setActive(page);
	load_requires('page_title');
}

function setActive(page) {
	var side_menu = $("#side-menu");
	side_menu.find('a').removeClass('active');
	side_menu.find('li').removeClass('menuitem-active');
	var anchor = side_menu.find('.open_page[data-page="' + page + '"]');
	var anchor_parent = anchor.parent('li');

	anchor_parent.addClass('menuitem-active');
	anchor.addClass('active');

}

function load_requires(url) {
	$.get({
		crossOrigin: false,
		url: "includes/" + url + ".html", 
		cache: false,
		dataType : 'html',
	}, function(data) {

		switch(url) {
			case 'sidebar':
				$("#side_bar").html(data);
				break;
			case 'page_title':
				$("#page_title").html(data);
				$('.current_page').html(current_page);
				break;
			case 'modal':
				$("#modal").html(data);
				break;
		}
	}).always(function() {

	});
}

var formats = {
	moment_format : "MMMM DD, YYYY",
	db_date_format : "YYYY-MM-DD",
	db_date_time_format : "YYYY-MM-DD HH:mm:ss",
	readable_format : "MMMM DD, YYYY",
	date_format : "DD",
	first_cut_off : 10,
	last_cut_off : 26
};

var functions = {
	toDateTimePicker : function (el) {

		return el.flatpickr({
			enableTime: true,
	    	dateFormat: formats.moment_format,
	    	altInput: true,
	        altFormat: formats.moment_format,
			parseDate: (datestr, format) => {
				return moment(datestr, format, true).toDate();
			},
			formatDate: (date, format, locale) => {
				return moment(date).format(format);
			}
		});
	},

	toDatePicker : function (el) {
		return el.flatpickr({
			allowInput:true,
	    	dateFormat: formats.moment_format,
	    	altInput: true,
	        altFormat: formats.moment_format,
			parseDate: (datestr, format) => {
				return moment(datestr, format, true).toDate();
			},
			formatDate: (date, format, locale) => {
				return moment(date).format(format);
			}
		});
	},

	sss_estimated_constributions : function (monthly_salary) {
		var deduction = 0;
		if ( monthly_salary >= 2250 && monthly_salary <= 2749.99 ) {
			deduction = 390.00;
		} else if ( monthly_salary >= 2750 && monthly_salary <= 3249.99 ) {

			deduction = 390.00;
		} else if ( monthly_salary >= 3250 && monthly_salary <= 3749.99 ) {

			deduction = 455.00;
		} else if ( monthly_salary >= 3750 && monthly_salary <= 4249.99 ) {

			deduction = 520.00;

		} else if ( monthly_salary >= 4250 && monthly_salary <= 4749.99 ) {

			deduction = 585.00;
		} else if ( monthly_salary >= 4750 && monthly_salary <= 5249.99 ) {

			deduction = 650.00;
		} else if ( monthly_salary >= 5250 && monthly_salary <= 5749.99 ) {

			deduction = 715.00;

		} else if ( monthly_salary >= 5750 && monthly_salary <= 6249.99 ) {

			deduction = 780.00;

		} else if ( monthly_salary >= 6250 && monthly_salary <= 6749.99 ) {

			deduction = 845.00;

		} else if ( monthly_salary >= 6750 && monthly_salary <= 7249.99 ) {

			deduction = 910.00;

		} else if ( monthly_salary >= 7250 && monthly_salary <= 7749.99 ) {

			deduction = 975.00;

		} else if ( monthly_salary >= 7750 && monthly_salary <= 8249.99 ) {

			deduction = 1040.00;

		} else if ( monthly_salary >= 8250 && monthly_salary <= 8749.99 ) {

			deduction = 1105.00;

		} else if ( monthly_salary >= 8750 && monthly_salary <= 9249.99 ) {

			deduction = 1170.00;

		} else if ( monthly_salary >= 9250 && monthly_salary <= 9749.99 ) {

			deduction = 1235.00;

		} else if ( monthly_salary >= 9750 && monthly_salary <= 10249.99 ) {

			deduction = 1300.00;

		} else if ( monthly_salary >= 10250 && monthly_salary <= 10749.99) {

			deduction = 1365.00;

		} else if ( monthly_salary >= 10750 && monthly_salary <= 11249.99 ) {

			deduction = 1430.00;

		} else if ( monthly_salary >= 11250 && monthly_salary <= 11749.99 ) {

			deduction = 1495.00;

		} else if ( monthly_salary >= 11750 && monthly_salary <= 12249.99 ) {

			deduction = 1560.00;

		} else if ( monthly_salary >= 12250 && monthly_salary <= 12749.99 ) {

			deduction = 1625.00;

		} else if ( monthly_salary >= 12750 && monthly_salary <= 13249.99 ) {

			deduction = 1690.00;

		} else if ( monthly_salary >= 13250 && monthly_salary <= 13749.99 ) {

			deduction = 1755.00;

		} else if ( monthly_salary >= 13750 && monthly_salary <= 14249.99 ) {

			deduction = 1820.00;

		} else if ( monthly_salary >= 14250 && monthly_salary <= 14749.99 ) {

			deduction = 1885.00;

		} else if ( monthly_salary >= 14750 && monthly_salary <= 15249.99 ) {

			deduction = 1950.00;

		} else if ( monthly_salary >= 15250 && monthly_salary <= 15749.99 ) {

			deduction = 2015.00;

		} else if ( monthly_salary >= 15750 && monthly_salary <= 16249.99 ) {

			deduction = 2080.00;

		} else if ( monthly_salary >= 16250 && monthly_salary <= 16749.99 ) {

			deduction = 2145.00;

		} else if ( monthly_salary >= 16750 && monthly_salary <= 17249.99 ) {

			deduction = 2210.00;

		} else if ( monthly_salary >= 17250 && monthly_salary <= 17749.99 ) {

			deduction = 2275.00;

		} else if ( monthly_salary >= 17750 && monthly_salary <= 18249.99 ) {

			deduction = 2340.00;

		} else if ( monthly_salary >= 18250 && monthly_salary <= 18749.99 ) {

			deduction = 2405.00;

		} else if ( monthly_salary >= 18750 && monthly_salary <= 19249.99 ) {

			deduction = 2470.00;

		} else if ( monthly_salary >= 19250 && monthly_salary <= 19749.99 ) {

			deduction = 2535.00;

		} else if ( monthly_salary >= 19750 && monthly_salary <= 20249.99 ) {

			deduction = 2600.00;

		} else if ( monthly_salary >= 20250 && monthly_salary <= 20749.99 ) {

			deduction = 2665.00;

		} else if ( monthly_salary >= 20750 && monthly_salary <= 21249.99 ) {

			deduction = 2730.00;

		} else if ( monthly_salary >= 21250 && monthly_salary <= 21749.99 ) {

			deduction = 2795.00;

		} else if ( monthly_salary >= 21750 && monthly_salary <= 22249.99 ) {

			deduction = 2860.00;

		} else if ( monthly_salary >= 22250 && monthly_salary <= 22749.99 ) {

			deduction = 2925.00;

		} else if ( monthly_salary >= 22750 && monthly_salary <= 23249.99 ) {

			deduction = 2990.00;

		} else if ( monthly_salary >= 23250 && monthly_salary <= 23749.99 ) {

			deduction = 3055.00;

		} else if ( monthly_salary >= 23750 && monthly_salary <= 24249.99 ) {

			deduction = 3120.00;

		} else if ( monthly_salary >= 24250 && monthly_salary <= 24749.99 ) {

			deduction = 3185.00;

		} else if ( monthly_salary >= 24750 ) {

			deduction = 3250.00;

		}

		return "₱ " + convertToDecimal(deduction);
	},

	getCurrentWeek : function () {
		var currentDate = moment();

		var weekStart = currentDate.clone().startOf('isoWeek');
		var weekEnd = currentDate.clone().endOf('isoWeek');

		var days = [];
		var days_to_db = [];

		for (var i = 0; i <= 6; i++) {
			days.push({
				day : moment(weekStart).add(i, 'days').format("MMMM Do, ddd"),
				day_to_db : moment(weekStart).add(i, 'days').format(formats.db_date_format),
				day_name : moment(weekStart).add(i, 'days').format("ddd")
			});
			// days_to_db.push(moment(weekStart).add(i, 'days').format(formats.db_date_format));
		}


		return days;
	},

	preventDefault : function (evt) {
		evt.preventDefault();
	},

	showHideLoader : function (flag = true) {
		if ( flag ) {

			$("#loading-modal").show();

		} else {

			$("#loading-modal").hide();

		}
	},

	api_call : function (params) {
		return $.ajax({
			type : params.type,
			url  : api_url + params.url,
			dataType : 'json',
			data : params.data
		});
	
	},

	download_file : function (data) {
		var anchor = document.createElement('a');
		anchor.href = data.url;
		anchor.target = '_blank';
		anchor.download = data.file_name;
		anchor.click();
	},

	capitalizeFirstLetter : function (string) {
	  return string.charAt(0).toUpperCase() + string.slice(1);
	},

	loadModal : function (target, isAdd = true) {
		var target = $("#" + target + "_modal");

		if ( isAdd ) {
			functions.clearInputs(target.find('form'));
		}

		target.modal();
	},

	convertToDecimal : function (data) {
		return (Math.round(data * 100) / 100).toFixed(2)
	},

	clearInputs : function (el) {
		el.find('.form-control').val('');
		el.find('select').val('').trigger('change');
		el.find('input[type="checkbox"]').prop('checked', false);
		el.find('input[data-read_prop="1"]').attr('readonly', true);
	},

	toast : function (params) {
		$.toast({
		    heading: params.heading,
		    text: params.message,
		    icon: params.icon,
		    loader: params.loader,
		    loaderBg: params.loaderBg,
		    position: params.position,
		    allowToastClose: false,
		    hideAfter: 10000
		});
	},

	closeModal : function (modal) {
		modal.modal('hide');
	},

	pager : function (params) {
		var pagination = $("#js-pagination");
		var previous = pagination.find('.prev');
		var next = pagination.find('.nxt');
		var page_numbers = pagination.find('.pagination_numbers');
		var search_results = $("#search_results");

		var current_page = Number(params.current_page);
		var total_num = Number(params.total_num);
		var per_page = Number(params.per_page);
		var total_page = Math.ceil(total_num / per_page);

		var search_range = (((current_page - 1) * 10) + 1) + " - " + (((current_page - 1) + 1) * 10) + " of " + total_num;

		if ( total_page == current_page ) {
			search_range =  (((current_page - 1) * 10) + 1) + " - " + total_num + " of " + total_num;
		}

		search_results.html(search_range);
		
		if ( current_page == 1 ) {
			previous.css({
				'pointer-events' : 'none'
			});
		} else {
			previous.css({
				'pointer-events' : 'auto'
			});
			previous.data('next_page', (current_page - 1));

		}

		if ( total_page == current_page ) {
			next.css({
				'pointer-events' : 'none'
			});
		} else {
			next.css({
				'pointer-events' : 'auto'
			});
			next.data('next_page', (current_page + 1));
		}

		page_numbers.empty();
		for ( var i = 1; i <= total_page; i++ ) {

			page_numbers.append(`
				<li class="page-item">
					<a class="page-link" data-next_page='${i}' href="javascript: void(0);">${i}</a>
				</li>
			`);
		}

		var prev_pages = 0;
		var next_pages = 0;
		var mean = (parseInt(current_page / 5));
		
		if ( (current_page % 5) == 0 ) {
			mean = mean - 1;
		}
		
		if ( mean >= 1 ) {
			mean = (mean + (mean * 5)) - (mean - 1);
		}

		var max = Math.ceil(current_page / 5) * 5;

		if ( (current_page % 5) == 0 ) {
			max = (Math.ceil(current_page / 5) * 5) + 1;
		}

		prev_pages = mean;
		next_pages = max;

		if ( current_page == 1 || current_page == 2 ) {
			prev_pages = 0;
			next_pages = 5;
		}

		var length_children = page_numbers.children('.page-item').length;
		page_numbers.children('.page-item').each(function(evt) {
			var self = $(this);
			var index = $('.page-item').index(self);

			if ( index < prev_pages ) {
				self.css({
					'display' : 'none'
				});
			}

			if ( index > next_pages ) {
				self.css({
					'display' : 'none'
				});
			}
		});

		page_numbers.children('.page-item').eq((current_page - 1)).addClass('active');
	}
}