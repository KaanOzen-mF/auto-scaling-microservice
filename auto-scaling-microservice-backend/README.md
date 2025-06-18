# Auto-Scaling Microservices Platform

This project, developed for a Cloud Computing course, is a prototype of a microservices platform that can automatically scale based on incoming load. The system involves two containerized microservices running on Kubernetes, monitored by Prometheus, and visualized with Grafana.

## Architecture Overview

The system consists of two main microservices: **Product Service** and **Stock Service**. Each service is an independent Node.js application with its own business logic.

- **Containerization:** Both services are packaged into their own portable images using Docker.
- **Orchestration:** The containerized services run on Minikube, a local Kubernetes cluster. Separate Kubernetes `Deployment` and `Service` (NodePort type) resources exist for each service.
- **Auto-Scaling:** The "Product Service" is configured with a Horizontal Pod Autoscaler (HPA) that monitors CPU usage and can automatically increase or decrease the number of Pods based on the load.
- **Monitoring:** Prometheus collects metrics from the services (via the `/metrics` endpoint). Grafana is used to visualize these metrics and has dashboards that provide real-time information about the system's performance.

## Technology Stack

- **Backend:** Node.js, Express.js, TypeScript
- **Containerization & Orchestration:** Docker, Kubernetes, Minikube
- **Monitoring:** Prometheus, Grafana, prom-client
- **Testing:** Jest (Unit Tests), k6 (Load Tests)
- **Package Management:** npm, Helm
- **Version Control:** Git

## Prerequisites

To run this project on your local machine, the following tools must be installed:

1. **Docker Desktop:** To run containers.
2. **Minikube:** To create the local Kubernetes cluster.
3. **kubectl:** To interact with the Kubernetes cluster.
4. **Helm:** To install complex applications like Prometheus/Grafana.
5. **k6:** To run load tests (optional).
6. **Node.js and npm:** To develop the services locally.

## Setup and Deployment Steps

**Note:** Commands may differ for PowerShell or Git Bash/MINGW64.

1.  **Clone the Project:**

    ```bash
    git clone <your_project_git_url>
    cd <project_folder>
    ```

2.  **Start Minikube:**

    ```bash
    minikube start
    ```

3.  **Set up the Minikube Docker Environment:**
    Ensure your terminal's Docker commands are pointed to Minikube's internal Docker daemon.

    - **For PowerShell:** `minikube -p minikube docker-env | Invoke-Expression`
    - **For Git Bash:** `eval $(minikube -p minikube docker-env)`

4.  **Build the Microservice Docker Images:**
    **Remaining in the same terminal**, build the images for each service::

    ```bash
    # For Product Service (in the root directory)
    cd auto-scaling-microservice-backend
    docker build -t product-service .

    # For Stock Service (navigate to the stock-service directory)
    cd stock-service
    docker build -t stock-service .
    cd .. # Return to the root directory
    ```

5.  **Set up the Monitoring Infrastructure (Prometheus & Grafana):**
    Install the monitoring stack using Helm and `kube-prometheus-stack`. (This is for reference; if already installed, you can skip this.)

    ```bash
    kubectl create namespace monitoring
    helm repo add prometheus-community [https://prometheus-community.github.io/helm-charts](https://prometheus-community.github.io/helm-charts)
    helm repo update
    helm install prometheus-stack prometheus-community/kube-prometheus-stack --namespace monitoring --wait
    ```

6.  **Deploy the Microservices to Kubernetes:**
    Run the `kubectl apply` commands for each service.

    ```bash
    # Deploy the Product Service
    kubectl apply -f service.yaml
    kubectl apply -f deployment.yaml
    kubectl apply -f product-service-hpa.yaml
    kubectl apply -f product-service-servicemonitor.yaml

    # Deploy the Stock Service
    cd stock-service
    kubectl apply -f stock-service-service.yaml
    kubectl apply -f stock-service-deployment.yaml
    # Note: HPA and ServiceMonitor have not yet been created for the Stock Service.
    ```

7.  **Access the Services:**
    Run the following commands in separate terminals to get the access URLs for each service:
    ```bash
    minikube service product-service --url
    minikube service stock-service-svc --url
    ```

## Running Tests

- **Unit Tests:** Navigate to the respective service directory (`cd auto-scaling-microservice-backend` or `cd stock-service`), run `npm install`, and then run `npm test`.
- **Load Tests:** Navigate to the `auto-scaling-microservice-backend/load-tests directory` and run `k6 run <script_name.js>`.
