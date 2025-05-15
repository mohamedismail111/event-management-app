"use strict";

// Class definition
var KTCustomersList = function () {
    // Define shared variables
    var datatable;
    var table;
    var flatpickr;
    var minDate, maxDate;

    // Private functions
    var initCustomerList = function () {

        // Init datatable --- more info on datatables: https://datatables.net/manual/
        datatable = $(table).DataTable({

        });

        // Re-init functions on every table re-draw -- more info: https://datatables.net/reference/event/draw
        datatable.on('draw', function () {

        });
    }

    // Init flatpickr --- more info :https://flatpickr.js.org/getting-started/
    var initFlatpickr = () => {

        const element = document.querySelector('#kt_Booking_flatpickr');

        flatpickr = $(element).flatpickr({
            altInput: true,
            altFormat: "d/m/Y",
            dateFormat: "Y-m-d",
            mode: "range",
            onChange: function (selectedDates, dateStr, instance) {
                handleFlatpickr(selectedDates, dateStr, instance);
            },
        });

    }
    // Search Datatable --- official docs reference: https://datatables.net/reference/api/search()
    var handleSearchDatatable = () => {
        const filterSearch = document.querySelector('[data-kt-custom-table-filter="search"]');
        filterSearch.addEventListener('keyup', function (e) {
            datatable.search(e.target.value).draw();
        });
    }


    // Handle status filter dropdown
    var handleStatusFilter = () => {
        const filterStatus = document.querySelector('[data-kt-booking-status-filter="status"]');
        $(filterStatus).on('change', e => {
            let value = e.target.value;
            if (e.target.value === 'all') {
                e.target.value = '';
            }
            datatable.search(e.target.value).draw();
        });
    }

    // Handle flatpickr
    var handleFlatpickr = (selectedDates, dateStr, instance) => {

        minDate = selectedDates[0] ? new Date(selectedDates[0]) : null;
        maxDate = selectedDates[1] ? new Date(selectedDates[1]) : null;

        if (maxDate) {
            maxDate.setHours(23, 59, 59, 999); // Adjust the maxDate to include the end of the day
        }

        // Update the custom filtering function logic accordingly
        $.fn.dataTable.ext.search.push(function (settings, data, dataIndex) {
            let dateAdded = new Date(moment(data[4], 'YYYY-MM-DD'));
            return (!minDate || dateAdded >= minDate) && (!maxDate || dateAdded <= maxDate);
        });

        datatable.draw(); // Redraw the DataTable with the new filter
    };


    // Handle clear flatpickr
    var handleClearFlatpickr = () => {
        const clearButton = document.querySelector('#kt_booking_flatpickr_clear');
        if(clearButton){
            clearButton.addEventListener('click', e => {
                flatpickr.clear();
            });
        }
    }

    // Public methods
    return {
        init: function () {

            table = document.querySelector('#kt_customers_table');

            if (!table) {
                return;
            }

            initCustomerList();
            initFlatpickr();
            handleSearchDatatable();
            handleStatusFilter();
            handleClearFlatpickr();
        }
    }
}();

// On document ready
KTUtil.onDOMContentLoaded(function () {
    KTCustomersList.init();
});