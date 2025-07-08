export class NumberGenerator {
  static generateRandomNumbers(count: number, min: number = 1, max: number = 90): number[] {
    const numbers: number[] = [];
    const used = new Set<number>();

    while (numbers.length < count) {
      const num = Math.floor(Math.random() * (max - min + 1)) + min;
      if (!used.has(num)) {
        used.add(num);
        numbers.push(num);
      }
    }

    return numbers.sort((a, b) => a - b);
  }

  static generateSerialNumber(): string {
    return Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
  }

  static getTop20FrequentNumbers(): number[] {
    // Simulación de números más frecuentes basados en estadísticas típicas de lotería
    return [
      7, 3, 9, 1, 13, 15, 21, 25, 31, 33,
      37, 39, 41, 43, 47, 49, 51, 53, 57, 61
    ];
  }

  static selectRandomFromTop20(count: number): number[] {
    const top20 = this.getTop20FrequentNumbers();
    const selected: number[] = [];
    const used = new Set<number>();

    while (selected.length < count && selected.length < top20.length) {
      const randomIndex = Math.floor(Math.random() * top20.length);
      const num = top20[randomIndex];
      
      if (!used.has(num)) {
        used.add(num);
        selected.push(num);
      }
    }

    return selected.sort((a, b) => a - b);
  }
}