
export interface DiceGroup {
    count: number;
    sides: number | 'd%';
    type: string;
    keep?: 'highest' | 'lowest';
    keepCount?: number;
}



export interface ParseResult {
    groups: DiceGroup[];
    modifier: number;
    originalNotation: string;
}

export class DiceParser {

    /**
     * Parses a dice notation string into component parts.
     * Supports: XdY, +N, -N, d%, d100.
     * Groups multiple dice types: 2d6 + 1d8 + 5
     */
    public static parse(notation: string): ParseResult {
        const cleanNotation = notation.toLowerCase().replace(/\s+/g, '');
        const result: ParseResult = {
            groups: [],
            modifier: 0,
            originalNotation: notation
        };

        // Split by operators (+ or -), keeping the operator
        // Regex lookahead to split before + or -
        // BUT we need to handle the first term which might not have + 
        // Example: "2d6+5" -> ["2d6", "+5"]

        // Simpler approach: Match all terms
        // Regex: ([+-]?)([\d]*)[dD]([%]|\d+) | ([+-]?\d+)

        // Term Types:
        // 1. Dice: [sign][count]d[sides] (e.g. -2d6, d20, +d%)
        // 2. Flat: [sign][value] (e.g. +5, -2)

        // Regex Breakdown:
        // ([+-]?)                  -> Sign (optional)
        // (?:(\d+))?               -> Count (optional, default 1)
        // d                        -> Literal 'd'
        // (%|\d+)                  -> Sides (%, 100, 6...)
        // OR
        // ([+-]?)                  -> Sign
        // (\d+)                    -> Value (Modifier)

        // We'll iterate through the string using a tokenizer approach to be safer?
        // Or just run regexes. 
        // Issue: "2d6+5" might match "5" as mod. "2d6" as dice.
        // What about invalid chars?

        // Step 1: Normalize
        let parserStr = cleanNotation;
        if (!parserStr.startsWith('+') && !parserStr.startsWith('-')) {
            parserStr = '+' + parserStr;
        }

        // Tokenize by splitting at +/-
        // "2d6+5-1d4" -> "+2d6", "+5", "-1d4" (after normalization)
        // Split regex: /(?=[+-])/
        const tokens = parserStr.split(/(?=[+-])/).filter(t => t.trim() !== '');

        for (const token of tokens) {
            this.parseToken(token, result);
        }

        return result;
    }

    private static parseToken(token: string, result: ParseResult) {
        // Sign
        let sign = 1;
        let content = token;
        if (token.startsWith('-')) {
            sign = -1;
            content = token.substring(1);
        } else if (token.startsWith('+')) {
            content = token.substring(1);
        }

        // Check if Dice
        if (content.includes('d')) {
            // Split by 'd'
            const parts = content.split('d');
            const countStr = parts[0];
            let sidesStr = parts[1];

            let count = countStr === '' ? 1 : parseInt(countStr);
            if (isNaN(count)) count = 1;
            count *= sign;

            // Check for Keep usage: kh (Keep Highest) or kl (Keep Lowest)
            let keep: 'highest' | 'lowest' | undefined;
            let keepCount: number | undefined;

            if (sidesStr.includes('kh')) {
                keep = 'highest';
                const kp = sidesStr.split('kh');
                sidesStr = kp[0];
                const kCount = parseInt(kp[1]);
                keepCount = isNaN(kCount) ? 1 : kCount;
            } else if (sidesStr.includes('kl')) {
                keep = 'lowest';
                const kp = sidesStr.split('kl');
                sidesStr = kp[0];
                const kCount = parseInt(kp[1]);
                keepCount = isNaN(kCount) ? 1 : kCount;
            }

            // Sides
            let sides: number | 'd%';
            let type = '';

            if (sidesStr === '%') {
                sides = 'd%';
                type = 'd%';
            } else {
                const s = parseInt(sidesStr);

                if (s === 66) {
                    sides = 66;
                    type = 'd66';
                } else if (s === 88) {
                    sides = 88;
                    type = 'd88';
                } else if (s === 100) {
                    sides = 100;
                    type = 'd100';
                } else {
                    sides = isNaN(s) ? 6 : s;
                    type = `d${sides}`;
                }
            }

            result.groups.push({
                count: count,
                sides: sides,
                type: type,
                keep,
                keepCount
            });

        } else {
            // Modifier
            const val = parseInt(content);
            if (!isNaN(val)) {
                result.modifier += (val * sign);
            }
        }
    }
}
