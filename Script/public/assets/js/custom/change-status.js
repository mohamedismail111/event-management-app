$(document).ready(function () {

  // Cache jQuery selectors
  const $statusSelect = $('#bookingStatusSelect');
  const $cancellationReasonForm = $('#cancellationReasonForm');
  const $cancellationByForm = $("#cancellationByForm")

  // Function to update visibility of fields
  function updateFields() {
    const selectedStatus = $statusSelect.val();

    if (selectedStatus === 'Cancelled') {
      $cancellationReasonForm.removeClass('d-none');
      $cancellationByForm.removeClass('d-none');
    } else {
      $cancellationReasonForm.addClass('d-none');
      $cancellationByForm.addClass('d-none');
    }
  }

  updateFields();
  // Event listener to update fields when status changes
  $statusSelect.change(updateFields);

});