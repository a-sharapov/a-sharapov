export const inclineTime = (subject: number, words: string[]): string => {
  return words[
    subject % 100 > 4 && subject % 100 < 20
      ? 2
      : [2, 0, 1, 1, 1, 2][subject % 10 < 5 ? Math.abs(subject) % 10 : 5]
  ];
};

export const delay = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};
