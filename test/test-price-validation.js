const { parsePriceWithK } = require('../helper');

describe('parsePriceWithK', () => {
    describe('Valid inputs', () => {
        test('should parse plain number "500"', () => {
            expect(parsePriceWithK('500')).toBe(500);
        });

        test('should parse number with k suffix "500k"', () => {
            expect(parsePriceWithK('500k')).toBe(500000);
        });

        test('should parse decimal with k suffix "500.5k"', () => {
            expect(parsePriceWithK('500.5k')).toBe(500500);
        });

        test('should parse large number "50000"', () => {
            expect(parsePriceWithK('50000')).toBe(50000);
        });

        test('should parse decimal with k suffix "1.5k"', () => {
            expect(parsePriceWithK('1.5k')).toBe(1500);
        });

        test('should parse decimal starting with dot ".5k"', () => {
            expect(parsePriceWithK('.5k')).toBe(500);
        });

        test('should handle input with spaces " 500k "', () => {
            expect(parsePriceWithK(' 500k ')).toBe(500000);
        });

        test('should parse "100k"', () => {
            expect(parsePriceWithK('100k')).toBe(100000);
        });

        test('should parse "1000"', () => {
            expect(parsePriceWithK('1000')).toBe(1000);
        });
    });

    describe('Invalid inputs', () => {
        test('should return NaN for double k "500kk"', () => {
            expect(parsePriceWithK('500kk')).toBeNaN();
        });

        test('should return NaN for letters "abc"', () => {
            expect(parsePriceWithK('abc')).toBeNaN();
        });

        test('should return NaN for wrong suffix "500x"', () => {
            expect(parsePriceWithK('500x')).toBeNaN();
        });

        test('should return NaN for k at start "k500"', () => {
            expect(parsePriceWithK('k500')).toBeNaN();
        });

        test('should return NaN for k in middle "50k0"', () => {
            expect(parsePriceWithK('50k0')).toBeNaN();
        });

        test('should return NaN for word "hello"', () => {
            expect(parsePriceWithK('hello')).toBeNaN();
        });

        test('should return NaN for space before k "500 k"', () => {
            expect(parsePriceWithK('500 k')).toBeNaN();
        });

        test('should return NaN for just "k"', () => {
            expect(parsePriceWithK('k')).toBeNaN();
        });

        test('should return NaN for empty string', () => {
            expect(parsePriceWithK('')).toBeNaN();
        });
    });
});
