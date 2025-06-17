// load-tests/product-service-test.js
import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  // stages: [
  //   { duration: '30s', target: 20 },
  //   { duration: '1m', target: 20 },
  //   { duration: '10s', target: 0 },
  // ],
  vus: 10,
  duration: "30s",
  thresholds: {
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<500"],
  },
};

export default function () {
  const productServiceUrl = "http://127.0.0.1:51717/products"; // minikube service product-service --url

  const res = http.get(productServiceUrl);

  check(res, {
    "status was 200": (r) => r.status === 200,
  });

  sleep(1);
}
