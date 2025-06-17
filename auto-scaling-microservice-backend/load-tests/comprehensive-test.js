// load-tests/comprehensive-test.js
import http from "k6/http";
import { check, sleep, group } from "k6";
import { Trend } from "k6/metrics";

// --- Test Options ---
export const options = {
  stages: [
    { duration: "30s", target: 20 }, // 30 seconds 20 user
    { duration: "1m", target: 20 }, // 1 minute 20 user
    { duration: "30s", target: 50 }, // 30 seconds 50 user
    { duration: "2m", target: 50 }, // 2 minutes 50 user
    { duration: "1m", target: 0 }, // 1 minute 0 user
  ],
  thresholds: {
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<800"], // Let's aim to keep the 95th percentile below 800ms even at peak load
    "http_req_duration{group:::list_products}": ["p(95)<600"], // Expect product listing to be faster
    "http_req_duration{group:::get_one_product}": ["p(90)<400"], // Single product retrieval should be even faster
  },
};

const BASE_URL = "http://127.0.0.1:51717"; // `minikube service product-service --url`

const sampleProductIds = [
  "ddb8d215-1106-4ce8-aaf6-996c479abe70", // laptop
  "f5f93fa5-33a0-446f-bffb-a0d8b4fb8adb", // wireless mouse
];

// --- Test Scenarios ---
export default function () {
  // 70% of users list products, 30% look at a single product

  group("list_products", function () {
    // Request to list all products
    const res = http.get(`${BASE_URL}/products?page=1&limit=10`);
    check(res, { "status is 200 (list)": (r) => r.status === 200 });
  });

  sleep(1); // Wait between requests

  if (sampleProductIds.length > 0) {
    group("get_one_product", function () {
      // Pick a random product ID from the sample list
      const productId =
        sampleProductIds[Math.floor(Math.random() * sampleProductIds.length)];

      const res = http.get(`${BASE_URL}/products/${productId}`);
      check(res, { "status is 200 (get one)": (r) => r.status === 200 });
    });
  }

  sleep(2); // Wait longer between iterations
}
