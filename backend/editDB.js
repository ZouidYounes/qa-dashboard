#!/usr/bin/env node

import Database from "./db.js";
import readline from "readline";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt) {
  return new Promise((resolve) => rl.question(prompt, resolve));
}

async function main() {
  console.log("🎹 QA Dashboard - Database Editor\n");

  const db = new Database("./data.db");
  db.initialize();

  // Wait for database to initialize
  await new Promise((resolve) => setTimeout(resolve, 500));

  try {
    // Get all test cases
    const testCases = await db.all(
      "SELECT id, suite_id, name, url, expected_events FROM test_cases",
    );

    if (testCases.length === 0) {
      console.log("❌ No test cases found. Create one first using the API.");
      rl.close();
      return;
    }

    console.log(`📋 Found ${testCases.length} test case(s):\n`);
    testCases.forEach((tc, idx) => {
      console.log(`${idx + 1}. ${tc.name}`);
      console.log(`   URL: ${tc.url}`);
    });

    const choice = await question(
      "\n📌 Which test case to edit? (enter number): ",
    );
    const index = parseInt(choice) - 1;

    if (index < 0 || index >= testCases.length) {
      console.log("❌ Invalid selection");
      rl.close();
      return;
    }

    const testCase = testCases[index];
    console.log(`\n✅ Editing: ${testCase.name}\n`);

    // Show current values
    console.log("Current URL:", testCase.url);
    const expectedEvents = JSON.parse(testCase.expected_events);
    console.log("Current Expected Events:");
    console.log(JSON.stringify(expectedEvents, null, 2));

    const editUrl = await question("\n🔗 Update URL? (y/n): ");
    let newUrl = testCase.url;
    if (editUrl.toLowerCase() === "y") {
      newUrl = await question("Enter new URL: ");
    }

    const editEvents = await question("\n📊 Update Expected Events? (y/n): ");
    let newEventsStr = testCase.expected_events;
    if (editEvents.toLowerCase() === "y") {
      console.log(
        "\nEnter JSON array of events (or press Enter to keep current):",
      );
      console.log('Example: [{"type":"pageView","eventName":"page_view"}]');
      const input = await question("> ");
      if (input.trim()) {
        try {
          JSON.parse(input);
          newEventsStr = input;
        } catch (e) {
          console.log("❌ Invalid JSON");
          rl.close();
          return;
        }
      }
    }

    console.log("\n⏳ Updating database...");

    // Update database with explicit callback to ensure commit
    await new Promise((resolve, reject) => {
      db.db.run(
        "UPDATE test_cases SET url = ?, expected_events = ? WHERE id = ?",
        [newUrl, newEventsStr, testCase.id],
        function(err) {
          if (err) {
            reject(err);
          } else {
            console.log(`   Changed ${this.changes} row(s)`);
            resolve();
          }
        },
      );
    });

    // Wait and verify the update
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Verify the change was saved
    const updated = await db.get(
      "SELECT url, expected_events FROM test_cases WHERE id = ?",
      [testCase.id],
    );

    if (updated && updated.url === newUrl) {
      console.log("\n✅ Test case updated successfully!\n");
      console.log("Updated values:");
      console.log("URL:", updated.url);
      console.log(
        "Expected Events:",
        JSON.stringify(JSON.parse(updated.expected_events), null, 2),
      );
    } else {
      console.log("\n⚠️  Update may not have saved properly.");
      if (updated) {
        console.log("Current URL in DB:", updated.url);
      }
    }

    await db.close();
    rl.close();
  } catch (error) {
    console.error("❌ Error:", error.message);
    rl.close();
  }
}

main();
