$(document).ready(function() {
	$(document).on('submit', '#new_holiday_form', function(evt) {
		functions.preventDefault(evt);
		var self = $(this);
		
		var btn = self.find('button[type=submit]:focus');
		self.find('button').attr('disabled', 'disabled');
		holiday.add_holiday(self);
		if ( btn.data('submit_type') ) {
			functions.closeModal($('#new_holiday_modal'));
		}

	});

	$(document).on('shown.bs.modal', '#new_holiday_modal', function(evt) {
		var self = $(this);

		$("#holiday_type").select2({
			width : "100%",
			minimumResultsForSearch: Infinity,
			dropdownParent : $("#holiday_type").parent(),
		});
	});

	$(document).on('submit', '#holiday_search', function(evt) {
		functions.preventDefault(evt);
		var self = $(this);
		var data = self.serialize() + "&is_paginate=1";
		var table = $("#holiday-tbl");
		var table_parent = table.parent('.horizontal-scroll');
		var tbody = table.find('tbody');
		var loader = $("#inner_loader").clone();
		var per_page = 10;
		var page = self.find('input[name="page"]').val();
		var search_button = self.find('.js-search');
		search_button.attr("disabled", 'true');

		tbody.empty();
		loader.removeClass('hide_el');
		loader.css({
			display : 'inherit'
		});
		table_parent.prepend(loader);
		table.addClass('hide_el');
		table.siblings('.pagination').addClass('hide_el');

		table_parent.find('.no-results').remove();
		get_holidays(data);
	});

	

});

async function get_holidays(data) {
	var holidays = await holiday.search_holiday(data)
	holiday_search(holidays);
}

async function holiday_search(data) {
	var self = $("#holiday_search");
	var table = $("#holiday-tbl");
	var table_parent = table.parent('.horizontal-scroll');
	var tbody = table.find('tbody');
	var loader = $("#inner_loader").clone();
	var per_page = 10;
	var page = self.find('input[name="page"]').val();
	var search_button = self.find('.js-search');

	table.parents('.card').removeClass('hide_el');
	$("#search_results").addClass('hide_el');

	if ( data.status == "success" ) {
		functions.pager({
			current_page : page,
			per_page : per_page,
			total_num : data.res.total_count
		});

		if ( data.res.total_count > 0 ) {

			setTimeout(function() {

				$.each(data.res.list, function(idx, val) {
					var holiday_date = moment(val.holiday_date, "YYYY-MM-DD").format("MMMM DD, YYYY");
					tbody.append(`
						<tr>
							<td>${val.holiday}</td>
							<td>${val.holiday_type}</td>
							<td class="text-center">${holiday_date}</td>
							<td class='text-center' data-designation_id="${val.holiday_id}">
								<button type="button" class="holiday-edit btn btn-sm btn-info waves-effect waves-light">
                                    <span class="btn-label">
                                    	<i class="mdi mdi-circle-edit-outline"></i>
                                    </span>
                                    Update
                                </button>

                                <button type="button" class="holiday-del btn btn-sm btn-danger waves-effect waves-light">
                                    <span class="btn-label">
                                    	<i class="mdi mdi-trash-can-outline"></i>
                                    </span>
                                    Delete
                                </button>
							</td>
						</tr>
					`);
				});

				table.removeClass('hide_el');
				table.siblings('.pagination').removeClass('hide_el');
			}, 1000);

		} else {
			var no_results = $(".no-results").clone();
			no_results.removeClass('hide_el');
			setTimeout(function() {
				table_parent.append(no_results);
				table_parent.find('.inner_loader').remove();
			}, 1000);
		}
	}

	table_parent.find('.inner_loader').remove();
	search_button.removeAttr('disabled');
}


var holiday = {
	search_holiday : function(data = null) {
		return functions.api_call({
			type : "GET",
			url : "/holiday/search_holiday",
			data : data
		});
	},
	add_holiday : function(self) {
		var data = self.serialize();
		functions.api_call({
			type : "POST",
			url : "/holiday/add_holiday",
			data : data
		}).then(function(data) {
			var response = data.res;

			if ( response.success ) {
				functions.clearInputs(self);
				functions.toast({
					heading : "Success!",
					message : response.message,
					icon : "success",
					loader : false,
					loaderBg : "green",
					position : 'top-right'
				});
				
				
			} else {
				functions.toast({
					heading : "Error!",
					message : response.message,
					icon : "error",
					loader : false,
					loaderBg : "red",
					position : 'top-right'
				});
			}

			if ( response.is_update ) {
				$("#holiday_search").submit();
			}
		}).fail(function(data) {
			functions.toast({
				heading : "Error!",
				message : "Failed to add Holiday!",
				icon : "error",
				loader : false,
				loaderBg : "red",
				position : 'top-right'
			});
		}).always(function(data) {
			self.find('button').removeAttr('disabled');
			$("#new_holiday_modal").find('form').find('.staff-buttons').children('.save_new_btn').removeClass('hide_el');
		});
	}
};
