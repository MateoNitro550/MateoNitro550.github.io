function typeWriterEffect(element, textArray, typingSpeed, erasingSpeed) {
  let currentSentenceIndex = 0;
  let currentCharIndex = 0;

  // Shuffle the textArray to randomize the order of remaining messages
  const shuffledTextArray = shuffle(textArray.slice(2));
  const randomizedTextArray = textArray.slice(0, 2).concat(shuffledTextArray);

  function type() {
    if (currentSentenceIndex < randomizedTextArray.length) {
      if (currentCharIndex < randomizedTextArray[currentSentenceIndex].length) {
        element.textContent += randomizedTextArray[currentSentenceIndex].charAt(currentCharIndex);
        currentCharIndex++;
        setTimeout(type, typingSpeed);
      } else {
        setTimeout(erase, 1000);
      }
    } else {
      currentSentenceIndex = 0;
      type();
    }
  }

  function erase() {
    if (currentCharIndex >= 0) {
      const currentText = randomizedTextArray[currentSentenceIndex].substring(0, currentCharIndex);
      element.textContent = currentText;
      currentCharIndex--;
      setTimeout(erase, erasingSpeed);
    } else {
      currentSentenceIndex++;
      setTimeout(type, typingSpeed);
    }
  }

  type();
}

// Function to shuffle an array using the Fisher-Yates algorithm
function shuffle(array) {
  let currentIndex = array.length;
  let temporaryValue, randomIndex;

  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}

document.addEventListener("DOMContentLoaded", function () {
  const typewriterElement = document.querySelector(".typewriter-text");
  const sentences = [
    "¡Comienza tu Aventura en el Hacking!",
    "Begin Your Hacking Adventure!",
    "Hack The Box Machines",
    "TryHackMe Rooms",
    "VulnHub VM's",
    "CTF's",
    "Automate with Scripts",
    "Automatiza con Scripts",
    "Vulnerabilities Explained",
    "Explicación de Vulnerabilidades",
    "Explore with Linux",
    "Explora con Linux",
  ];
  const typingSpeed = 100;
  const erasingSpeed = 50;

  typeWriterEffect(typewriterElement, sentences, typingSpeed, erasingSpeed);
});
