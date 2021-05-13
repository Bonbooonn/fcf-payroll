$(document).ready(function() {

	$(document).on('submit', '#new_designation_form', function(evt) {
		functions.preventDefault(evt);

		var self = $(this)
		var btn = self.find("button[type=submit]:focus");
		self.find('button').attr('disabled', 'disabled');
		add_designation(self);
		if ( btn.data('submit_type') ) {
			functions.closeModal($("#new_designation_modal"));
		}
	});

	$(document).on('click', '#sss_check', function(evt) {
		var self = $(this);

		$("#sss_estimated").attr('readonly', false);

		if ( !self.is(':checked') ) {
			$("#sss_estimated").val('');
			$("#sss_estimated").attr('readonly', true);
		}
		
	});

	$(document).on('click', '#phil_health_check', function(evt) {
		var self = $(this);

		$("#phil_health_estimated").attr('readonly', false);

		if ( !self.is(':checked') ) {
			$("#phil_health_estimated").val('');
			$("#phil_health_estimated").attr('readonly', true);
		}
		
	});

	$(document).on('click', '#pag_ibig_check', function(evt) {
		var self = $(this);

		$("#pag_ibig_estimated").attr('readonly', false);

		if ( !self.is(':checked') ) {
			$("#pag_ibig_estimated").val('');
			$("#pag_ibig_estimated").attr('readonly', true);
		}
		
	});

	$(document).on('submit', '#designation_search', function(evt) {
		functions.preventDefault(evt);
		var self = $(this)
		var data = self.serialize();
		var table = $("#designation-tbl");
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

		functions.api_call({
			type : "GET",
			url : "/designation/search_designation",
			data : data
		}).done(function(data) {
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
							tbody.append(`
								<tr>
									<td>${val.designation}</td>
									<td class="text-right">₱ ${val.sss ? functions.convertToDecimal(val.sss) : "0.00"}</td>
									<td class="text-right">₱ ${val.pag_ibig ? functions.convertToDecimal(val.pag_ibig) : "0.00"}</td>
									<td class="text-right">₱ ${val.phil_health ? functions.convertToDecimal(val.phil_health) : "0.00"}</td>
									<td class="text-center">${val.ee_count}</td>
									<td class='text-center' data-designation_id="${val.designation_id}">
										<button type="button" class="designation-edit btn btn-sm btn-info waves-effect waves-light">
	                                        <span class="btn-label">
	                                        	<i class="mdi mdi-circle-edit-outline"></i>
	                                        </span>
	                                        Update
	                                    </button>

	                                    <button type="button" class="designation-del btn btn-sm btn-danger waves-effect waves-light">
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

		}).always(function() {
			setTimeout(function() {
				table_parent.find('.inner_loader').remove();
				search_button.removeAttr('disabled');
			}, 1000);
		});
	});

	$(document).on('click', '.designation-edit', function(evt) {
		var self = $(this);
		var parent = self.parent('td');
		var designation_id = parent.data('designation_id');
		var target = "new_designation";
		var modal = $("#new_designation_modal");
		var form = modal.find('#new_designation_form');
		modal.find('.modal_header').html("Update Designation");
		form.find('.staff-buttons').children('.save_new_btn').addClass('hide_el');

		functions.api_call({
			type : "GET",
			url : "/designation/get_designation_details",
			data : {
				designation_id : designation_id
			}
		}).done(function(data) {

			if ( data.status == "success" ) {
				form.find('input[name="designation"]').val(data.res.designation);
				form.find('input[name="designation_id"]').val(designation_id);
				functions.loadModal(target, false);
			}
		})

	});

	$(document).on('click', '.designation-del', function(evt) {
		var self = $(this);
		var parent = self.parent('td');
		var designation_id = parent.data('designation_id');
		var target = "confirm";
		var modal = $("#confirm_modal");
		var form = modal.find("#confirm_form");
		modal.find('.modal_header').html("Are you sure you want to delete designation?");
		form.children("#delete_inputs").empty();
		form.attr('action', '');
		form.attr('action', '/designation/delete_designation');
		form.children("#delete_inputs").append(`
			<input type="hidden" name="designation_id" value="${designation_id}" />
		`);

		form.find('.btn_delete').data('func', 'designation_search');
		functions.loadModal(target);
	});

	function add_designation(self) {
		var data = self.serialize();
		functions.api_call({
			type : "POST",
			url : "/designation/add_designation",
			data : data
		}).done(function(data) {
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
				$("#designation_search").submit();
			}

		}).fail(function(data) {
			functions.toast({
				heading : "Error!",
				message : "Failed to add Designation!",
				icon : "error",
				loader : false,
				loaderBg : "red",
				position : 'top-right'
			});
		}).always(function(data) {
			self.find('button').removeAttr('disabled');
			$("#new_designation_modal").find('form').find('.staff-buttons').children('.save_new_btn').removeClass('hide_el');
		});
	}
});

