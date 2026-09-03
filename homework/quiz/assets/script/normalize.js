// Answer normalization + tolerant matching for free-text quiz input.
// See KONZEPT-quiz-plattform.md §4.

const DIACRITICS = /[\u0300-\u036f]/g;
const PUNCTUATION = /['’‘\-.]/g;
const WHITESPACE = /\s+/g;

export function normalize(text) {
    return text
        .trim()
        .toLowerCase()
        .replace(/ß/g, 'ss')
        .normalize('NFD')
        .replace(DIACRITICS, '')
        .replace(PUNCTUATION, '')
        .replace(WHITESPACE, ' ')
        .trim();
}

export function levenshtein(a, b) {
    const rows = a.length + 1;
    const cols = b.length + 1;
    const distances = Array.from({length: rows}, (_, i) => [i, ...Array(cols - 1).fill(0)]);
    for (let j = 0; j < cols; j++) {
        distances[0][j] = j;
    }

    for (let i = 1; i < rows; i++) {
        for (let j = 1; j < cols; j++) {
            if (a[i - 1] === b[j - 1]) {
                distances[i][j] = distances[i - 1][j - 1];
            } else {
                distances[i][j] = 1 + Math.min(
                    distances[i - 1][j],
                    distances[i][j - 1],
                    distances[i - 1][j - 1],
                );
            }
        }
    }

    return distances[rows - 1][cols - 1];
}

function typoTolerance(candidateLength) {
    return candidateLength >= 8 ? 2 : 1;
}

/**
 * Compares free-text input against a canonical answer and its aliases.
 * Returns:
 *   {status: 'correct', canonical}
 *   {status: 'almost', canonical, distance} — within typo tolerance
 *   {status: 'wrong'}
 */
export function matchAnswer(input, canonical, aliases = []) {
    const normalizedInput = normalize(input);
    if (normalizedInput === '') {
        return {status: 'wrong', canonical};
    }

    const candidates = [canonical, ...aliases];

    for (const candidate of candidates) {
        if (normalize(candidate) === normalizedInput) {
            return {status: 'correct', canonical};
        }
    }

    let bestDistance = Infinity;
    for (const candidate of candidates) {
        const normalizedCandidate = normalize(candidate);
        const distance = levenshtein(normalizedInput, normalizedCandidate);
        if (distance <= typoTolerance(normalizedCandidate.length) && distance < bestDistance) {
            bestDistance = distance;
        }
    }

    if (bestDistance < Infinity) {
        return {status: 'almost', canonical, distance: bestDistance};
    }

    return {status: 'wrong', canonical};
}
