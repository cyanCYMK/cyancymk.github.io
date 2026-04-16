$(document).ready(function() {
  const data = window.FLASHCARD_DATA;
  const $flashcard = $("#flashcard");
  const $flashcardFront = $("#flashcard-front");
  const $flashcardBack = $("#flashcard-back");

  let currentCardIndex = 0;
  let currentCardData = getCard(data, currentCardIndex);

  $flashcardFront.text(currentCardData.question);
  $flashcardBack.text(currentCardData.answer);
  if (currentCardData.type === "algorithm") {
    $flashcardBack.css("text-align", "left");
    $flashcardBack.css("white-space", "pre-wrap");
    $flashcardBack.css("overflow", "auto");
    $flashcardBack.css("backface-visibility", "hidden");
    $flashcardBack.css("webkit-backface-visibility", "hidden");
    $flashcardBack.css("border", "1px solid black");
    $flashcardBack.css("border-radius", "10px");
    $flashcardBack.css("padding", "20px");
    $flashcardBack.css("box-shadow", "0 4px 14px rgba(0, 0, 0, 0.12)");
    $flashcardBack.css('font-family', 'monospace');
    $flashcardBack.css('font-size', '14px');
    $flashcardBack.css('line-height', '1.5');
    $flashcardBack.css('color', '#333');
    $flashcardBack.css('background-color', '#fff');
    $flashcardBack.css('border-color', '#ccc');
    $flashcardBack.css('border-radius', '5px');
    $flashcardBack.css('padding', '10px');
  }

  $("form").on("submit", function(e) {
    e.preventDefault();
    const wasFlipped = $flashcard.hasClass("flipped");

    if (!wasFlipped) {
      $flashcardBack.text(currentCardData.answer);
      $flashcard.addClass("flipped");
    } else {
      $flashcard.removeClass("flipped");
      currentCardIndex = (currentCardIndex + 1) % data.length;
      currentCardData = data[currentCardIndex];
      $flashcardFront.text(currentCardData.question);
      $flashcardBack.text(currentCardData.answer);
      $("#answer").val("");
    }
  });

  $flashcard.on("click", function() {
    $flashcard.toggleClass("flipped");
  });
});

function getCard(data, index) {
  const idx = index ?? Math.floor(Math.random() * data.length);
  return data[idx];
}
