````markdown
# Assignment 5: Blue-Green Deployment on Kubernetes using AWS ALB Ingress

This project demonstrates a **Blue-Green Deployment strategy** on Kubernetes using the **AWS Load Balancer Controller** and **ALB Ingress weighted routing**.

The deployment uses two application versions:

- **Blue version**
- **Green version**

Traffic is controlled using AWS ALB weighted target groups through Kubernetes Ingress annotations.

---

## Project Structure

```bash
Asignment-5/
├── k8s/
│   ├── blue-deployment.yaml
│   ├── green-deployment.yaml
│   ├── blue-service.yaml
│   ├── green-service.yaml
│   ├── ingress-0-blue-100-green.yaml
│   ├── ingress-rollback-100-blue.yaml
│   └── namespace.yaml
└── README.md
````

---

## Objective

The objective of this assignment is to:

* Deploy two versions of an application on Kubernetes
* Expose both versions using Kubernetes Services
* Configure AWS ALB Ingress
* Route 100% traffic to the Green version
* Roll back traffic to the Blue version using weighted routing

---

## Prerequisites

Before running this project, make sure you have:

* AWS CLI configured
* kubectl installed
* eksctl installed
* An EKS cluster running
* AWS Load Balancer Controller installed
* Proper IAM permissions for ALB creation
* Kubernetes namespace created

---

## Namespace

Create the namespace:

```bash
kubectl create namespace bluegreen
```

Or apply the namespace file:

```bash
kubectl apply -f k8s/namespace.yaml
```

---

## Deploy Blue Version

Apply the Blue deployment and service:

```bash
kubectl apply -f k8s/blue-deployment.yaml
kubectl apply -f k8s/blue-service.yaml
```

Verify:

```bash
kubectl get pods -n bluegreen
kubectl get svc -n bluegreen
```

---

## Deploy Green Version

Apply the Green deployment and service:

```bash
kubectl apply -f k8s/green-deployment.yaml
kubectl apply -f k8s/green-service.yaml
```

Verify:

```bash
kubectl get pods -n bluegreen
kubectl get svc -n bluegreen
```

---

## ALB Ingress Configuration

The ALB Ingress uses the following annotation for weighted routing:

```yaml
alb.ingress.kubernetes.io/actions.weighted-routing: >
  {"type":"forward","forwardConfig":{"targetGroups":[{"serviceName":"blue-service","servicePort":"80","weight":0},{"serviceName":"green-service","servicePort":"80","weight":100}]}}
```

This configuration sends:

* 0% traffic to Blue
* 100% traffic to Green

Apply the ingress:

```bash
kubectl apply -f k8s/ingress-0-blue-100-green.yaml
```

Check the ingress:

```bash
kubectl get ingress -n bluegreen
kubectl describe ingress bluegreen-ingress -n bluegreen
```

---

## Access the Application

Get the ALB DNS name:

```bash
kubectl get ingress -n bluegreen
```

Open the ALB address in your browser:

```bash
http://<ALB-DNS-NAME>
```

Example:

```bash
http://bluegreen-demo-alb-xxxxxxxx.us-east-1.elb.amazonaws.com
```

---

## Rollback to Blue Version

To roll back traffic from Green to Blue, create a rollback ingress file:

```bash
cp k8s/ingress-0-blue-100-green.yaml k8s/ingress-rollback-100-blue.yaml
nano k8s/ingress-rollback-100-blue.yaml
```

Update the weighted routing annotation:

```yaml
alb.ingress.kubernetes.io/actions.weighted-routing: >
  {"type":"forward","forwardConfig":{"targetGroups":[{"serviceName":"blue-service","servicePort":"80","weight":100},{"serviceName":"green-service","servicePort":"80","weight":0}]}}
```

This rollback configuration sends:

* 100% traffic to Blue
* 0% traffic to Green

Apply the rollback ingress:

```bash
kubectl apply -f k8s/ingress-rollback-100-blue.yaml
```

Verify:

```bash
kubectl describe ingress bluegreen-ingress -n bluegreen
```

---

## Useful Commands

Check pods:

```bash
kubectl get pods -n bluegreen
```

Check services:

```bash
kubectl get svc -n bluegreen
```

Check ingress:

```bash
kubectl get ingress -n bluegreen
```

Describe ingress:

```bash
kubectl describe ingress bluegreen-ingress -n bluegreen
```

Check all resources:

```bash
kubectl get all -n bluegreen
```

---

## Cleanup

To delete the resources:

```bash
kubectl delete -f k8s/ingress-rollback-100-blue.yaml
kubectl delete -f k8s/green-service.yaml
kubectl delete -f k8s/green-deployment.yaml
kubectl delete -f k8s/blue-service.yaml
kubectl delete -f k8s/blue-deployment.yaml
kubectl delete namespace bluegreen
```

If you applied the Green ingress instead of rollback ingress, delete it using:

```bash
kubectl delete -f k8s/ingress-0-blue-100-green.yaml
```

---

## Final Result

This assignment successfully demonstrates:

* Kubernetes Blue-Green Deployment
* AWS ALB Ingress setup
* Weighted traffic routing
* 100% traffic shift to Green
* Rollback from Green to Blue

---

## Author

**Name:** Hashim.
**Assignment:** Kubernetes Blue-Green Deployment using AWS ALB
**Platform:** AWS EKS

```
