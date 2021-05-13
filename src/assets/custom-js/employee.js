
$(document).ready(function() {

	$(document).on('submit', '#new_employee_form', function(evt) {
		functions.preventDefault(evt);

		var self = $(this)
		var btn = self.find("button[type=submit]:focus" );
		self.find('button').attr('disabled', 'disabled');
		add_employee(self);
		if ( btn.data('submit_type') ) {
			functions.closeModal($("#new_employee_modal"));
		}

	});

	$(document).on('input', "input[name='daily_salary']", function(evt) {
		var self = $(this);
		var val = self.val();

		var monthly = Number(val) * 22;
		$("input[name='monthly_salary']").val(functions.convertToDecimal(monthly));
	});

	$(document).on('input', "input[name='monthly_salary']", function(evt) {
		var self = $(this);
		var val = self.val();

		var daily = Number(val) / 22;
		$("input[name='daily_salary']").val(functions.convertToDecimal(daily));
	});

	$(document).on("shown.bs.modal", '#new_employee_modal', function(evt) {
		var self = $(this);
		select2_designations()
		.always(function() {
			var designation_id = $("#designation_id").data('val');

			if ( !designation_id ) {
				designation_id = "";
			}

			$("#designation_id").select2({
				width : "100%",
				dropdownParent : $("#designation_id").parent(),
			}).val(designation_id).trigger('change.select2');

			if ( self.data('load_inner') ) {
				functions.loadModal("new_employee");
			}

		});
		$("#staff_status").select2({
			width : "100%",
			minimumResultsForSearch: Infinity,
			dropdownParent : $("#staff_status").parent(),
		});
	});

	$(document).on('hide.bs.modal', '#new_employee_modal', function(evt) {
		 $("#designation_id").data('val', '');
	});

	$(document).on('submit', '#employee_search', function(evt) {
		functions.preventDefault(evt);
		var self = $(this);
		var table = $("#employee-tbl");
		var tbody = table.find('tbody');
		var table_parent = table.parent('.horizontal-scroll');
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
			url : self.attr('action'),
			data : self.serialize()
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
						var date_today = moment().format(formats.date_format);
						var month = moment().format('MMMM');
						var year = moment().format('YYYY');
						var cut_off_date = "";
						date_today = 10;
						var date = "";
						if ( date_today <= formats.first_cut_off ) {
							date = 15;
							// date = moment().format("MMM") + "15" + moment().format('YYYY');
							var last_month = moment().subtract(1, "months").format("MMMM");

							var min_date = moment((formats.last_cut_off), formats.date_format).format("DD");
							var max_date = moment(formats.first_cut_off, formats.date_format).format("DD");

							var min_cut_off = moment((last_month + "-" + min_date), "MMMM-DD").format("MMMM DD");
							var max_cut_off = moment((month + "-" + max_date), "MMMM-DD").format("MMMM DD");

							// cut_off_date = moment(date, formats.date_format).format(formats.readable_format);
							cut_off_date = min_cut_off + "-" + max_cut_off + ", " + year;
						} else if ( date_today > formats.first_cut_off && date_today <= formats.last_cut_off ) {
							// date = moment().endOf('month').format(formats.date_format);
							var min_date = moment((formats.first_cut_off + 1), formats.date_format).format("DD");
							var max_date = moment(formats.last_cut_off, formats.date_format).format("DD");				


							cut_off_date = month + " " + min_date + "-" + max_date + ", " + year;
						}

						

						$.each(data.res.list, function(idx, val) {

							tbody.append(`
								<tr>
									<td>
										<a href="#" data-head="Employee Cut-Off Information (${cut_off_date})" data-target="income" class="open_modal">${val.ee_full_name}</a>
									</td>
									<td>${val.designation}</td>
									<td>${val.email}</td>
									<td>${val.phone}</td>
									<td>${val.status}</td>
									<td class='text-center' data-ee_id="${val.ee_id}">
										<button type="button" class="ee-edit btn btn-sm btn-info waves-effect waves-light">
	                                        <span class="btn-label">
	                                        	<i class="mdi mdi-circle-edit-outline"></i>
	                                        </span>
	                                        Update
	                                    </button>

	                                    <button type="button" class="ee-del btn btn-sm btn-danger waves-effect waves-light">
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

	$(document).on('click', '.ee-del', function(evt) {
		var self = $(this);
		var parent = self.parent('td');
		var ee_id = parent.data('ee_id');
		var target = "confirm";
		var modal = $("#confirm_modal");
		var form = modal.find("#confirm_form");
		modal.find('.modal_header').html("Are you sure you want to delete employee?");
		form.children("#delete_inputs").empty();
		form.attr('action', '');
		form.attr('action', '/employee/delete_employee');
		form.children("#delete_inputs").append(`
			<input type="hidden" name="ee_id" value="${ee_id}" />
		`);

		form.find('.btn_delete').data('func', 'employee_search');
		functions.loadModal(target);
	});

	$(document).on('click', '.ee-edit', function(evt) {
		var self = $(this);
		var parent = self.parent('td');
		var ee_id = parent.data('ee_id');
		var target = "new_employee";
		var modal = $("#new_employee_modal");
		var form = modal.find('#new_employee_form');
		form.find('.staff-buttons').children('.save_new_btn').addClass('hide_el');

		functions.api_call({
			type : "GET",
			url : "/employee/get_employee_details",
			data : {
				ee_id : ee_id
			}
		}).done(function(data) {

			if ( data.status == "success" ) {
				var response = data.res;
				form.find('input[name="employee_id"]').val(response.ee_id);
				form.find('input[name="first_name"]').val(response.first_name);
				form.find('input[name="middle_name"]').val(response.middle_name);
				form.find('input[name="last_name"]').val(response.last_name);
				form.find('input[name="email"]').val(response.email);
				form.find('input[name="phone"]').val(response.phone);
				form.find('input[name="daily_salary"]').val(response.daily_salary);
				form.find('input[name="monthly_salary"]').val(response.monthly_salary);

				form.find("#designation_id").data('val', response.designation_id);
				form.find("#staff_status").val(response.status).trigger('change');

				functions.loadModal(target, false);
			}

		});
	});

	function add_employee(self) {
		functions.api_call({
			type : "POST",
			url : "/employee/add_employee",
			data : self.serialize()
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
				$("#employee_search").submit();
			}

		}).fail(function(data) {
			functions.toast({
				heading : "Error!",
				message : "Failed to add employee!",
				icon : "error",
				loader : false,
				loaderBg : "red",
				position : 'top-right'
			});
		}).always(function(data) {
			self.find('button').removeAttr('disabled');
		});
	}

	function select2_designations() {
		return functions.api_call({
			type : "GET",
			url : "/designation/select2_designations"
		}).done(function(data) {
			var select2 = $("#designation_id");
			if ( data.res.length > 0 ) {
				select2.empty();
				select2.append(`
					<option value="">Please Select</option>
				`);
				$.each(data.res, function(idx, val) {
					select2.append(`
						<option value="${val.id}">${val.designation}</option>
					`);
				});
			}

		})
	}

});