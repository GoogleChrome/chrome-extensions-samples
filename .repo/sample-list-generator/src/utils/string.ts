// transforms a plural word into a singular word
export const singularize = (word: string): string => {
  if (word.endsWith('ies')) {
    return word.slice(0, -3) + 'y';
  } else if (word.endsWith('s')) {
    return word.slice(0, -1);
  } else {
    return word;
  }
};
