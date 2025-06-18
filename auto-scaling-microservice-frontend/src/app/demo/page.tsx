"use client";
import React from "react";

const DemoPage = () => {
  const k6Command = "k6 run .\\comprehensive-test.js";

  const handleCopyAndAlert = async () => {
    if (!navigator.clipboard) {
      alert(
        "Clipboard API is not available or you are not in a secure context (HTTPS/localhost required)."
      );
      console.error("Clipboard API is not available.");
      return;
    }

    try {
      await navigator.clipboard.writeText(k6Command);
      alert("Command copied to clipboard: " + k6Command);
    } catch (err) {
      console.error("Copy failed: ", err);
      alert("Error: Failed to copy command.");
    }
  };
  return (
    <main>
      <div className="mx-auto flex flex-col items-center justify-center p-4 w-3xl">
        <h1 className="text-3xl font-bold text-center mb-4 text-blue-600">
          Microservice Auto-Scaling Demo
        </h1>
        <div className="text-center mb-8 p-4 bg-gray-100 rounded-lg">
          <a
            href={
              "http://127.0.0.1:3001/d/f0300eb1-56a8-4668-b2c6-38fb40dcd8de/micro?orgId=1&from=now-6h&to=now&timezone=browser"
            }
            target="_blank"
            rel="noopener noreferrer"
            className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded transition-colors duration-200"
          >
            Open the Grafana Monitoring Dashboard
          </a>
          <p className="text-xs text-gray-500 mt-2">
            (To access Grafana, the `kubectl port-forward -n monitoring
            service/prometheus-stack-grafana 3001:80` command must be running.)
          </p>
        </div>
        <div className="text-center mb-8 p-4 bg-gray-100 rounded-lg">
          <button
            onClick={handleCopyAndAlert}
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded transition-colors duration-200"
          >
            Start the Comprehensive Load Test
          </button>
          <p className="text-xs text-gray-500 mt-2">
            This button displays the command required to run the test. To start
            the test, copy the command, run it in the terminal, and monitor the
            changes on the Grafana dashboard.
          </p>
        </div>
      </div>
    </main>
  );
};

export default DemoPage;
