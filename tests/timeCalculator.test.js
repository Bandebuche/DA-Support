const assert = require('assert');
const TimeCalculator = require('../js/timeCalculator.js');

console.log("=== Running TimeCalculator Unit Tests ===");

// 1. Standard calculation
const r1 = TimeCalculator.calculateDuration("14:10:00", "14:28:00");
assert.strictEqual(r1.formatted, "00:18");
assert.strictEqual(r1.minutes, 18);
console.log("✔ Test 1 Passed: 14:10 to 14:28 = 00:18 (18 mins)");

// 2. Cross-hour calculation
const r2 = TimeCalculator.calculateDuration("15:45:00", "17:15:00");
assert.strictEqual(r2.formatted, "01:30");
assert.strictEqual(r2.minutes, 90);
console.log("✔ Test 2 Passed: 15:45 to 17:15 = 01:30 (90 mins)");

// 3. Short format without seconds
const r3 = TimeCalculator.calculateDuration("12:15", "13:00");
assert.strictEqual(r3.formatted, "00:45");
assert.strictEqual(r3.minutes, 45);
console.log("✔ Test 3 Passed: 12:15 to 13:00 = 00:45 (45 mins)");

// 4. 12-hour format with PM
const r4 = TimeCalculator.calculateDuration("01:10 PM", "02:30 PM");
assert.strictEqual(r4.formatted, "01:20");
assert.strictEqual(r4.minutes, 80);
console.log("✔ Test 4 Passed: 01:10 PM to 02:30 PM = 01:20 (80 mins)");

// 5. Cross-midnight calculation
const r5 = TimeCalculator.calculateDuration("23:45:00", "00:30:00");
assert.strictEqual(r5.formatted, "00:45");
assert.strictEqual(r5.minutes, 45);
console.log("✔ Test 5 Passed: 23:45 to 00:30 (cross-midnight) = 00:45 (45 mins)");

// 6. Ticket ID generation
const ticketId = TimeCalculator.generateTicketId();
assert.match(ticketId, /^DA-\d{4}-[A-Z0-9]{4}$/);
console.log("✔ Test 6 Passed: Ticket ID generated correctly -> " + ticketId);

// 7. Human duration formatting
assert.strictEqual(TimeCalculator.formatHumanDuration(45), "45 mins");
assert.strictEqual(TimeCalculator.formatHumanDuration(90), "1 hr 30 mins");
assert.strictEqual(TimeCalculator.formatHumanDuration(60), "1 hr");
console.log("✔ Test 7 Passed: Human duration formatting");

console.log("\nALL 7 TESTS PASSED SUCCESSFULLY! 🚀");
