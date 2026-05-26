#!/usr/bin/env node

import Database from "./db.js";

async function main() {
  console.log("🧹 Clearing QA Dashboard Database...\n");

  const db = new Database("./data.db");
  db.initialize();

  // Wait for database to initialize
  await new Promise((resolve) => setTimeout(resolve, 500));

  try {
    console.log("Deleting all test results...");
    await db.run("DELETE FROM test_results");

    console.log("Deleting all test cases...");
    await db.run("DELETE FROM test_cases");

    console.log("Deleting all test suites...");
    await db.run("DELETE FROM test_suites");

    // Verify deletion
    const suites = await db.all("SELECT COUNT(*) as count FROM test_suites");
    const cases = await db.all("SELECT COUNT(*) as count FROM test_cases");
    const results = await db.all("SELECT COUNT(*) as count FROM test_results");

    console.log("\n✅ Database cleared!\n");
    console.log("Test Suites:", suites[0]?.count || 0);
    console.log("Test Cases:", cases[0]?.count || 0);
    console.log("Test Results:", results[0]?.count || 0);

    await db.close();
  } catch (error) {
    console.error("❌ Error:", error.message);
    try {
      await db.close();
    } catch (e) {}
  }
}

main();
