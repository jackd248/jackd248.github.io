// Quiz state machine: question sequence, weighted item selection, answer
// checking, life. No DOM access here — see play.html for rendering and
// timing (round timer, info-card pause). KONZEPT-quiz-plattform.md §6.

import {matchAnswer} from './normalize.js';

const MAX_LIFE = 3;
const ROUND_SIZE = 15;
const STREAK_MILESTONES = [5, 10, 15];

function weightedSample(pool, count, getWeight) {
    const remaining = [...pool];
    const picked = [];
    const n = Math.min(count, remaining.length);

    for (let i = 0; i < n; i++) {
        const weights = remaining.map(getWeight);
        const total = weights.reduce((sum, w) => sum + w, 0);
        let r = Math.random() * total;
        let index = 0;
        for (; index < weights.length - 1; index++) {
            r -= weights[index];
            if (r <= 0) {
                break;
            }
        }
        picked.push(remaining.splice(index, 1)[0]);
    }

    return picked;
}

export class QuizEngine {
    constructor({items, modeId, modes, getWeights = () => ({}), roundSize = ROUND_SIZE, maxLife = MAX_LIFE}) {
        this.items = items;
        this.modeId = modeId;
        this.modes = modes;
        this.getWeights = getWeights;
        this.roundSize = roundSize;
        this.maxLife = maxLife;
    }

    resolveModeId() {
        if (this.modeId !== 'mixed') {
            return this.modeId;
        }
        return this.modes[Math.floor(Math.random() * this.modes.length)].id;
    }

    startRound() {
        const weights = this.getWeights(this.items.map((item) => item.id));
        this.queue = weightedSample(this.items, this.roundSize, (item) => weights[item.id] ?? 1)
            .map((item) => ({item, modeId: this.resolveModeId()}));
        this.position = 0;
        this.life = this.maxLife;
        this.streak = 0;
        this.bestStreak = 0;
        this.awaitingAdvance = false;
        this.dead = false;
        return this.currentQuestion;
    }

    get currentQuestion() {
        if (!this.queue || this.position >= this.queue.length) {
            return null;
        }
        const {item, modeId} = this.queue[this.position];
        const mode = this.modes.find((m) => m.id === modeId);
        return {
            item,
            mode,
            promptText: item[mode.prompt],
            answerText: item[mode.answer],
            aliases: (item.aliases && item.aliases[mode.answer]) || [],
            index: this.position,
            total: this.queue.length,
        };
    }

    /** Checks free-text input against the current question. Does not advance. */
    submit(rawInput) {
        if (this.awaitingAdvance) {
            throw new Error('call advance() before submitting again');
        }

        const question = this.currentQuestion;
        const result = matchAnswer(rawInput, question.answerText, question.aliases);

        if (result.status === 'correct' || result.status === 'almost') {
            this.streak += 1;
            this.bestStreak = Math.max(this.bestStreak, this.streak);
            this.awaitingAdvance = true;
            const milestone = STREAK_MILESTONES.includes(this.streak) ? this.streak : null;
            return {...result, life: this.life, streak: this.streak, milestone, roundOver: false};
        }

        this.streak = 0;
        this.life -= 1;
        this.awaitingAdvance = true;
        this.dead = this.life <= 0;
        return {...result, life: this.life, streak: this.streak, milestone: null, roundOver: false};
    }

    /** Moves to the next question after the solution for the current one was shown. */
    advance() {
        this.awaitingAdvance = false;
        if (this.dead) {
            return {roundOver: true, won: false};
        }
        this.position += 1;
        const question = this.currentQuestion;
        if (question === null) {
            return {roundOver: true, won: true};
        }
        return {roundOver: false, question};
    }
}
