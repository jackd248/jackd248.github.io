// localStorage-backed progress: round highscore/streak per set+mode, and
// per-set item statistics (used for weighted item selection and the mastery
// map). See KONZEPT-quiz-plattform.md §6/§7.

function roundKey(setId, modeId) {
    return `quiz:${setId}:${modeId}`;
}

function statsKey(setId) {
    return `quiz:${setId}:stats`;
}

function today() {
    return new Date().toLocaleDateString();
}

function daysBetween(a, b) {
    const toDate = (dateString) => {
        const [day, month, year] = dateString.split('.');
        return new Date(Number(year), Number(month) - 1, Number(day));
    };
    const msPerDay = 24 * 60 * 60 * 1000;
    return Math.round((toDate(b) - toDate(a)) / msPerDay);
}

function loadRoundData(setId, modeId) {
    const raw = localStorage.getItem(roundKey(setId, modeId));
    return raw ? JSON.parse(raw) : {};
}

function saveRoundData(setId, modeId, data) {
    localStorage.setItem(roundKey(setId, modeId), JSON.stringify(data));
}

function isBetterScore(candidate, current) {
    if (!current) {
        return true;
    }
    if (candidate.lives !== current.lives) {
        return candidate.lives > current.lives;
    }
    return candidate.time < current.time;
}

/** Records a completed round. Highscore and the delta-vs-last-time only consider full wins. */
export function recordRound(setId, modeId, {time, lives, bestStreak, won}) {
    const data = loadRoundData(setId, modeId);
    const date = today();

    const previousWonRun = data.lastWonRun || null;

    if (won) {
        if (isBetterScore({time, lives}, data.highscore)) {
            data.highscore = {time, lives, bestStreak, date};
        }
        data.lastWonRun = {time, lives, bestStreak, date};
    }

    const streakData = data.dailyStreak;
    let currentStreak = 1;
    if (streakData) {
        const diff = daysBetween(streakData.lastPlayed, date);
        if (diff === 0) {
            currentStreak = streakData.currentStreak;
        } else if (diff === 1) {
            currentStreak = streakData.currentStreak + 1;
        }
    }
    data.dailyStreak = {lastPlayed: date, currentStreak};

    saveRoundData(setId, modeId, data);

    return {
        highscore: data.highscore,
        dailyStreak: currentStreak,
        deltaSeconds: won && previousWonRun ? previousWonRun.time - time : null,
    };
}

export function getRoundProgress(setId, modeId) {
    const data = loadRoundData(setId, modeId);
    return {
        highscore: data.highscore || null,
        dailyStreak: data.dailyStreak ? data.dailyStreak.currentStreak : 0,
    };
}

function loadStats(setId) {
    const raw = localStorage.getItem(statsKey(setId));
    return raw ? JSON.parse(raw) : {};
}

function saveStats(setId, stats) {
    localStorage.setItem(statsKey(setId), JSON.stringify(stats));
}

export function recordItemResult(setId, itemId, correct) {
    const stats = loadStats(setId);
    const entry = stats[itemId] || {correct: 0, incorrect: 0};
    if (correct) {
        entry.correct += 1;
    } else {
        entry.incorrect += 1;
    }
    stats[itemId] = entry;
    saveStats(setId, stats);
    return entry;
}

/** Higher weight = picked more often. Items with more mistakes come up more. */
export function getItemWeights(setId, itemIds) {
    const stats = loadStats(setId);
    const weights = {};
    for (const itemId of itemIds) {
        const entry = stats[itemId];
        weights[itemId] = entry ? 1 + entry.incorrect * 2 : 1;
    }
    return weights;
}

/** Per item: 'none' | 'light' (answered correctly once) | 'strong' (three times or more) */
export function getAllMastery(setId, itemIds) {
    const stats = loadStats(setId);
    const mastery = {};
    for (const itemId of itemIds) {
        const correct = stats[itemId] ? stats[itemId].correct : 0;
        mastery[itemId] = correct >= 3 ? 'strong' : correct >= 1 ? 'light' : 'none';
    }
    return mastery;
}
