$(document).ready(function() {
  console.log("jQuery is ready!");
  const data = window.FLASHCARD_DATA;
  const $flashcard = $("#flashcard");
  const $flashcardFront = $("#flashcard-front");
  const $flashcardBack = $("#flashcard-back");
  // todo: randomize the flashcard
  // todo: add next and previous buttons
  // todo: keep score of correct and incorrect answers
  let currentCardIndex = 0;
  let currentCardData = getCard(data, currentCardIndex);

  // render card
  $flashcardBack.hide();
  $flashcardBack.text(currentCardData.answer);
  $flashcardFront.text(currentCardData.question);

  $("form").on("submit", function(e) {
    e.preventDefault();
    const answer = $("#answer").val();
    // flip card
    $flashcard.toggleClass("flipped");
    currentCardIndex++;
    if (currentCardIndex < data.length) {
      currentCardData = data[currentCardIndex];
      $flashcardFront.text(currentCardData.question);
      $flashcardBack.text(currentCardData.answer);
    } else {
        currentCardIndex = 0;
    }
  });
});

function getCard(data, index) {
    const idx = index ?? Math.floor(Math.random() * data.length);
    return data[idx];
}
