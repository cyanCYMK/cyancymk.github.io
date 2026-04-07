$(document).ready(function() {
  const $canvas = $("#pixelCanvas");
  const $dims = $("#imageDimensions");

  $("#imageInput").on("change", function() {
    const file = this.files[0];
    if (!file) {
      $dims.empty();
      return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
      const img = new Image();
      img.onload = function() {
        const w = img.naturalWidth;
        const h = img.naturalHeight;
        const canvas = $canvas[0];
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        $dims.text(w + " × " + h + " px");
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
});
