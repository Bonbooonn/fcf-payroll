$(document).ready(function() {

	$(document).on('change', '.check_attendance', function(evt) {
		var self = $(this);
		var td_parent = self.parents('td');
		var ee_id = self.parents('tr').data('ee_id');

		if ( self.is(':checked') ) {
			var attendance_date = td_parent.data('date');
			var holiday_flag = td_parent.data('holiday_flag');

			var data = {
				attendance_date : attendance_date,
				holiday_flag : holiday_flag,
				ee_id : ee_id
			}

			if ( self.val() == 3 ) {
				data.is_late = 1;
			}
			
			functions.api_call({
				type : "POST",
				url : "/attendance/check_attendance",
				data : data
			}).done(function(data) {
				var response = data.res;

				if ( response.msg.success ) {
					self.attr('disabled', true);
					self.parents('.checkbox').siblings('.checkbox').find('.check_attendance').attr('disabled', true);
					self.data('att_id', response.att_id);
					functions.toast({
						heading : "Success!",
						message : response.msg.message,
						icon : "success",
						loader : false,
						loaderBg : "green",
						position : 'top-right'
					});
				} else {
					functions.toast({
						heading : "Error!",
						message : response.msg.message,
						icon : "error",
						loader : false,
						loaderBg : "red",
						position : 'top-right'
					});
				}

			});
		}

		
	});

	$(document).on('change', '.attendance_ot', function(evt) {
		var self = $(this);
		var checkbox = self.parent('.js-ot').siblings('.js-att_check').children('.checkbox').children('.check_attendance');
		var att_id = checkbox.data('att_id');
		
		if ( !checkbox.is(':checked') ) {
			functions.toast({
				heading : "Error!",
				message : "Please check attendance first!",
				icon : "error",
				loader : false,
				loaderBg : "red",
				position : 'top-right'
			});
			self.val('');
			return false;
		}

		var data = {
			att_id : att_id,
			overtime : self.val()
		};

		functions.api_call({
			type : "POST",
			url : "/attendance/check_attendance",
			data : data
		}).done(function(data) {
			var response = data.res;

			if ( response.msg.success ) {
				self.attr('disabled', true);
				functions.toast({
					heading : "Success!",
					message : response.msg.message,
					icon : "success",
					loader : false,
					loaderBg : "green",
					position : 'top-right'
				});
			} else {
				functions.toast({
					heading : "Error!",
					message : response.msg.message,
					icon : "error",
					loader : false,
					loaderBg : "red",
					position : 'top-right'
				});
			}

		});


	});

});

function holidays_list(data) {
	var thead = $("#attendance-th");
	var days = functions.getCurrentWeek();
	thead.empty();
	var value_days = {};
	if ( data.status == "success" ) {
		var holidays = data.res.list;

		thead.append("<th min-width-200>Employee Name</th>");
		$.each(days, function(idx, val) {
			var th_style = "";
			if ( val.day.includes('Sun') ) {
				th_style = "style='color : red'";
			}

			var key = val.day_name.toLowerCase();

			value_days[key] = {
				date : val.day_to_db
			};

			$.each(holidays, function(holiday_idx, holiday_val) {
				var holiday_date = moment(holiday_val.holiday_date, formats.db_date_format).format(formats.db_date_format);
				var day_date = moment(val.day, "MMMM Do, ddd").format(formats.db_date_format);

				if ( holiday_date == day_date ) {

					if ( holiday_val.holiday_type == "Regular" ) {
						value_days[key].holiday_flag = 1;
						th_style = "style='color : #1abc9c'";
					} else if ( holiday_val.holiday_type == "Special Non Working" ) {
						value_days[key].holiday_flag = 2;
						th_style = "style='color : #4a81d4'";
					} else if ( holiday_val.holiday_type == "Special Working" ) {
						value_days[key].holiday_flag = 3;
						th_style = "style='color : #f7b84b'";
					}

					return false;
				} else {
					value_days[key].holiday_flag = 0;
				}

			});

			thead.append(`
				<th class='text-center attendance-min-width' ${th_style}>${val.day}</th>
			`);
		});
		thead.append(`
			<th class="text-center">Action</th>
		`);

	}

	return value_days;
}

async function get_employees() {
	var self = $("#attendance_form");
	var table = $("#attendance-tbl");
	var tbody = table.find('tbody');
	var table_parent = table.parent('.horizontal-scroll');
	var per_page = 10;
	var page = self.find('input[name="page"]').val();
	var delay = 200;

	var holidays = await holiday.search_holiday({
		year : 2021
	});

	var value_days = await holidays_list(holidays);

	tbody.empty();
	table.addClass('hide_el');
	table.siblings('.pagination').addClass('hide_el');

	table_parent.find('.no-results').remove();


	var days_range = `&first_day=${value_days.mon.date}&last_day=${value_days.sun.date}`;

	functions.api_call({
		type : "GET",
		url : "/attendance/get_attendance",
		data : self.serialize() + days_range
	}).then(function(data) {

		table.parents('.card').removeClass('hide_el');
		
		$("#search_results").addClass('hide_el');

		if ( data.status == "success" ) {

			functions.pager({
				current_page : page,
				per_page : per_page,
				total_num : data.res.total_count
			});

			if ( data.res.total_count > 0 ) {

				$.each(data.res.list, function(idx, val) {

					value_days.mon.prop = "";
					value_days.mon.prop_late = "";
					value_days.tue.prop = "";
					value_days.tue.prop_late = "";
					value_days.wed.prop = "";
					value_days.wed.prop_late = "";
					value_days.thu.prop = "";
					value_days.thu.prop_late = "";
					value_days.fri.prop = "";
					value_days.fri.prop_late = "";
					value_days.sat.prop = "";
					value_days.sat.prop_late = "";
					value_days.sun.prop = "";
					value_days.sun.prop_late = "";
					value_days.mon.ot = "";
					value_days.tue.ot = "";
					value_days.wed.ot = "";
					value_days.thu.ot = "";
					value_days.fri.ot = "";
					value_days.sat.ot = "";
					value_days.sun.ot = "";

					if ( val.att_data ) {
						var att_data = val.att_data;
						$.each(att_data, function(idx, val) {
							if ( value_days.mon.date == val.att_date ) {

								if ( val.is_late ) {
									value_days.mon.prop_late = `disabled='true' checked='true' data-att_id='${val.att_id}'`;
									value_days.mon.prop = `disabled='true' data-att_id='${val.att_id}'`
								} else {
									value_days.mon.prop = `disabled='true' checked='true' data-att_id='${val.att_id}'`;
									value_days.mon.prop_late = `disabled='true' data-att_id='${val.att_id}'`;
								}

								
								value_days.mon.ot = `value="${val.ot ? val.ot : ""}" disabled="true"`;
							}

							if ( value_days.tue.date == val.att_date ) {

								if ( val.is_late ) {
									value_days.tue.prop_late = `disabled='true' checked='true' data-att_id='${val.att_id}'`;
									value_days.tue.prop = `disabled='true' data-att_id='${val.att_id}'`
								} else {
									value_days.tue.prop = `disabled='true' checked='true' data-att_id='${val.att_id}'`;
									value_days.tue.prop_late = `disabled='true' data-att_id='${val.att_id}'`;
								}

								value_days.tue.ot = `value="${val.ot ? val.ot : ""}" disabled="true"`;
							}

							if ( value_days.wed.date == val.att_date ) {

								if ( val.is_late ) {
									value_days.wed.prop_late = `disabled='true' checked='true' data-att_id='${val.att_id}'`;
									value_days.wed.prop = `disabled='true' data-att_id='${val.att_id}'`
								} else {
									value_days.wed.prop = `disabled='true' checked='true' data-att_id='${val.att_id}'`;
									value_days.wed.prop_late = `disabled='true' data-att_id='${val.att_id}'`;
								}

								value_days.wed.ot = `value="${val.ot ? val.ot : ""}" disabled="true"`;
							}

							if ( value_days.thu.date == val.att_date ) {

								if ( val.is_late ) {
									value_days.thu.prop_late = `disabled='true' checked='true' data-att_id='${val.att_id}'`;
									value_days.thu.prop = `disabled='true' data-att_id='${val.att_id}'`
								} else {
									value_days.thu.prop = `disabled='true' checked='true' data-att_id='${val.att_id}'`;
									value_days.thu.prop_late = `disabled='true' data-att_id='${val.att_id}'`;
								}

								value_days.thu.ot = `value="${val.ot ? val.ot : ""}" disabled="true"`;
							}

							if ( value_days.fri.date == val.att_date ) {

								if ( val.is_late ) {
									value_days.fri.prop_late = `disabled='true' checked='true' data-att_id='${val.att_id}'`;
									value_days.fri.prop = `disabled='true' data-att_id='${val.att_id}'`
								} else {
									value_days.fri.prop = `disabled='true' checked='true' data-att_id='${val.att_id}'`;
									value_days.fri.prop_late = `disabled='true' data-att_id='${val.att_id}'`;
								}

								value_days.fri.ot = `value="${val.ot ? val.ot : ""}" disabled="true"`;
							}

							if ( value_days.sat.date == val.att_date ) {

								if ( val.is_late ) {
									value_days.sat.prop_late = `disabled='true' checked='true' data-att_id='${val.att_id}'`;
									value_days.sat.prop = `disabled='true' data-att_id='${val.att_id}'`
								} else {
									value_days.sat.prop = `disabled='true' checked='true' data-att_id='${val.att_id}'`;
									value_days.sat.prop_late = `disabled='true' data-att_id='${val.att_id}'`;
								}

								value_days.sat.ot = `value="${val.ot ? val.ot : ""}" disabled="true"`;
							}

							if ( value_days.sun.date == val.att_date ) {

								if ( val.is_late ) {
									value_days.sun.prop_late = `disabled='true' checked='true' data-att_id='${val.att_id}'`;
									value_days.sun.prop = `disabled='true' data-att_id='${val.att_id}'`
								} else {
									value_days.sun.prop = `disabled='true' checked='true' data-att_id='${val.att_id}'`;
									value_days.sun.prop_late = `disabled='true' data-att_id='${val.att_id}'`;
								}

								value_days.sun.ot = `value="${val.ot ? val.ot : ""}" disabled="true"`;
							}
						});

					}

					tbody.append(`
						<tr data-ee_id="${val.ee_id}">
							<td>${val.ee_full_name}</td>
							<td class="text-center" data-holiday_flag="${value_days.mon.holiday_flag}" data-date="${value_days.mon.date}">
	                            <div class="form-group form-inline p-0 js-att_check ml-3">
	                            	<div class="checkbox checkbox-info mb-2 mr-2">
		                                <input id="mon${idx}" type="checkbox" class="check_attendance" value="1" ${value_days.mon.prop}>
		                                <label for="mon${idx}">
		                                    NL
		                                </label>
		                            </div>

		                            <div class="checkbox checkbox-info mb-2">
		                                <input id="mon_late${idx}" type="checkbox" class="check_attendance" value="3" ${value_days.mon.prop_late}>
		                                <label for="mon_late${idx}">
		                                    L
		                                </label>
		                            </div>
	                            </div>

	                            <div class="form-group row p-0 flex-center js-ot">
	                            	<input type="text" ${value_days.mon.ot} placeholder="OT(mins)" class="attendance_ot form-control form-control-sm col-sm-6 text-center number_only" />
	                            </div>

							</td>
							<td class="text-center" data-holiday_flag="${value_days.tue.holiday_flag}" data-date="${value_days.tue.date}">
								<div class="form-group form-inline p-0 js-att_check ml-3">
									<div class="checkbox checkbox-info mb-2 mr-2">
		                                <input id="tue${idx}" type="checkbox" class="check_attendance" value="1" ${value_days.tue.prop}>
		                                <label for="tue${idx}">
		                                    NL
		                                </label>
		                            </div>

		                            <div class="checkbox checkbox-info mb-2">
		                                <input id="tue_late${idx}" type="checkbox" class="check_attendance" value="3" ${value_days.tue.prop_late}>
		                                <label for="tue_late${idx}">
		                                    L
		                                </label>
		                            </div>

								</div>

								<div class="form-group row p-0 flex-center js-ot">
	                            	<input type="text ${value_days.tue.ot}" placeholder="OT(mins)" class="attendance_ot form-control form-control-sm col-sm-6 text-center number_only" />
	                            </div>
	                            
							</td>
							<td class="text-center"  data-holiday_flag="${value_days.wed.holiday_flag}" data-date="${value_days.wed.date}">
								<div class="form-group form-inline p-0 js-att_check ml-3">
									<div class="checkbox checkbox-info mb-2 mr-2">
		                                <input id="wed${idx}" type="checkbox" class="check_attendance" value="1" ${value_days.wed.prop}>
		                                <label for="wed${idx}">
		                                    NL
		                                </label>
		                            </div>

		                            <div class="checkbox checkbox-info mb-2">
		                                <input id="wed_late${idx}" type="checkbox" class="check_attendance" value="3" ${value_days.wed.prop_late}>
		                                <label for="wed_late${idx}">
		                                    L
		                                </label>
		                            </div>
								</div>

								<div class="form-group row p-0 flex-center js-ot">
	                            	<input type="text" ${value_days.wed.ot} placeholder="OT(mins)" class="attendance_ot form-control form-control-sm col-sm-6 text-center number_only" />
	                            </div>
	                            
							</td>
							<td class="text-center" data-holiday_flag="${value_days.thu.holiday_flag}" data-date="${value_days.thu.date}">
								<div class="form-group form-inline p-0 js-att_check ml-3">
									<div class="checkbox checkbox-info mb-2 mr-2">
		                                <input id="thurs${idx}" type="checkbox" class="check_attendance" value="1" ${value_days.thu.prop}>
		                                <label for="thurs${idx}">
		                                    NL
		                                </label>
		                            </div>

		                            <div class="checkbox checkbox-info mb-2">
		                                <input id="thurs_late${idx}" type="checkbox" class="check_attendance" value="3" ${value_days.thu.prop_late}>
		                                <label for="thurs_late${idx}">
		                                    L
		                                </label>
		                            </div>

								</div>

								<div class="form-group row p-0 flex-center js-ot">
	                            	<input type="text" ${value_days.thu.ot} placeholder="OT(mins)" class="attendance_ot form-control form-control-sm col-sm-6 text-center number_only" />
	                            </div>
	                            
							</td>
							<td class="text-center" data-holiday_flag="${value_days.fri.holiday_flag}" data-date="${value_days.fri.date}">
								<div class="form-group form-inline p-0 js-att_check ml-3">
									<div class="checkbox checkbox-info mb-2 mr-2">
		                                <input id="fri${idx}" type="checkbox" class="check_attendance" value="1" ${value_days.fri.prop}>
		                                <label for="fri${idx}">
		                                    NL
		                                </label>
		                            </div>

		                            <div class="checkbox checkbox-info mb-2">
		                                <input id="fri_late${idx}" type="checkbox" class="check_attendance" value="3" ${value_days.fri.prop_late}>
		                                <label for="fri_late${idx}">
		                                    L
		                                </label>
		                            </div>

								</div>

								<div class="form-group row p-0 flex-center js-ot">
	                            	<input type="text" ${value_days.fri.ot} placeholder="OT(mins)" class="attendance_ot form-control form-control-sm col-sm-6 text-center number_only" />
	                            </div>
	                            
							</td>
							<td class="text-center" data-holiday_flag="${value_days.sat.holiday_flag}" data-date="${value_days.sat.date}">
								<div class="form-group form-inline p-0 js-att_check ml-3">
									<div class="checkbox checkbox-info mb-2 mr-2">
		                                <input id="sat${idx}" type="checkbox" class="check_attendance" value="1" ${value_days.sat.prop}>
		                                <label for="sat${idx}">
		                                    NL
		                                </label>
		                            </div>

		                            <div class="checkbox checkbox-info mb-2">
		                                <input id="sat_late${idx}" type="checkbox" class="check_attendance" value="3" ${value_days.sat.prop_late}>
		                                <label for="sat_late${idx}">
		                                    L
		                                </label>
		                            </div>

								</div>

								<div class="form-group row p-0 flex-center js-ot">
	                            	<input type="text" ${value_days.sat.ot} placeholder="OT(mins)" class="attendance_ot form-control form-control-sm col-sm-6 text-center number_only" />
	                            </div>
	                            
							</td>
							<td class="text-center" data-holiday_flag="${value_days.sun.holiday_flag}" data-date="${value_days.sun.date}">
								<div class="form-group form-inline p-0 js-att_check ml-3">
									<div class="checkbox checkbox-info mb-2 mr-2">
		                                <input id="sun${idx}" type="checkbox" class="check_attendance" value="1" ${value_days.sun.prop}>
		                                <label for="sun${idx}">
		                                    NL
		                                </label>
		                            </div>

		                            <div class="checkbox checkbox-info mb-2">
		                                <input id="sun_late${idx}" type="checkbox" class="check_attendance" value="3" ${value_days.sun.prop_late}>
		                                <label for="sun_late${idx}">
		                                    L
		                                </label>
		                            </div>

								</div>

								<div class="form-group row p-0 flex-center js-ot">
	                            	<input type="text" ${value_days.sun.ot} placeholder="OT(mins)" class="attendance_ot form-control form-control-sm col-sm-6 text-center number_only" />
	                            </div>
	                            
							</td>
							<td class='text-center' data-ee_id="${val.ee_id}">
								<button type="button" class="ee-edit btn btn-sm btn-info waves-effect waves-light">
									<i class="mdi mdi-circle-edit-outline"></i>	                                        
                                </button>

                                <button type="button" class="ee-del btn btn-sm btn-danger waves-effect waves-light">
                                	<i class="mdi mdi-trash-can-outline"></i>	                                        
                                </button>
							</td>
						</tr>
					`);

				});

				table.removeClass('hide_el');
				table.siblings('.pagination').removeClass('hide_el');

			} else {

				var no_results = $(".no-results").clone();
				no_results.removeClass('hide_el');
				table_parent.append(no_results);

			}

		}

	});


}