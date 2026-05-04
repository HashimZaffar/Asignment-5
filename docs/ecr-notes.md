````markdown
# AWS ECR Setup & Image Management — Assignment 5

## Overview

This document describes the setup and usage of **Amazon Elastic Container Registry (ECR)** for storing Docker images used in the Blue/Green deployment project.

The ECR repository serves as the central image registry for Kubernetes (EKS), enabling consistent, version-controlled deployments.

---

## What is Amazon ECR?

Amazon ECR (Elastic Container Registry) is a fully managed Docker container registry provided by AWS.

It allows you to:

- Store Docker images securely
- Version images using tags
- Integrate with EKS/Kubernetes
- Scan images for vulnerabilities
- Control access using IAM

---

## Repository Details

- **Repository Name:** `bluegreen-demo`
- **Region:** `us-east-1`
- **Registry URI Format:**

```text
<aws_account_id>.dkr.ecr.<region>.amazonaws.com/bluegreen-demo
````

### Example

```text
123456789012.dkr.ecr.us-east-1.amazonaws.com/bluegreen-demo
```

---

## Images Stored

The following image versions are used for Blue/Green deployment:

```text
bluegreen-demo:v1  → Blue (stable version)
bluegreen-demo:v2  → Green (new version)
```

### Full Image URIs

```text
<account_id>.dkr.ecr.us-east-1.amazonaws.com/bluegreen-demo:v1
<account_id>.dkr.ecr.us-east-1.amazonaws.com/bluegreen-demo:v2
```

---

## Image Tagging Strategy

A clear tagging strategy is used to support deployment and rollback:

```text
v1 → stable (blue)
v2 → new release (green)
```

### Why not use `latest`?

Using `latest` is avoided because:

* It creates ambiguity in deployments
* Makes rollback difficult
* Reduces traceability

Instead, explicit version tags are used.

---

## Security & Compliance Features

### 1. Image Scanning

* Enabled using `scanOnPush=true`
* Automatically scans images for vulnerabilities after push

### 2. Encryption

* AES-256 encryption enabled for stored images

### 3. Access Control

* Controlled via AWS IAM
* Only authorized users/services can push or pull images

---

## Authentication Flow

Before pushing images, Docker must authenticate with ECR.

```bash
aws ecr get-login-password --region <region> | \
docker login --username AWS --password-stdin <account_id>.dkr.ecr.<region>.amazonaws.com
```

### Explanation

* AWS generates a temporary login token
* Docker uses this token to authenticate with ECR
* Required before any push or pull operation

---

## Image Push Workflow

### Step 1 — Build Image

```bash
docker build -t bluegreen-demo:v1 .
docker build -t bluegreen-demo:v2 .
```

### Step 2 — Tag Image for ECR

```bash
docker tag bluegreen-demo:v1 <ECR_URI>:v1
docker tag bluegreen-demo:v2 <ECR_URI>:v2
```

### Step 3 — Push Image

```bash
docker push <ECR_URI>:v1
docker push <ECR_URI>:v2
```

---

## Verification

List images in ECR:

```bash
aws ecr list-images \
  --repository-name bluegreen-demo \
  --region us-east-1
```

Check vulnerability scan results:

```bash
aws ecr describe-image-scan-findings \
  --repository-name bluegreen-demo \
  --image-id imageTag=v1 \
  --region us-east-1
```

---

## Integration with Kubernetes (EKS)

ECR images will be used in Kubernetes deployments.

Example:

```yaml
image: <account_id>.dkr.ecr.us-east-1.amazonaws.com/bluegreen-demo:v1
```

Kubernetes pulls images directly from ECR to run containers.

---

## Role in Blue/Green Deployment

ECR enables version-based deployments:

```text
v1 (Blue)  → current production version
v2 (Green) → new version for testing
```

Traffic switching is handled later at the Kubernetes/ALB level.

Rollback becomes simple:

```text
Switch traffic back to v1 if v2 fails
```

---

## Best Practices Applied

* Versioned image tagging (`v1`, `v2`)
* Avoided use of `latest`
* Enabled image vulnerability scanning
* Enabled encryption at rest
* Used IAM-based authentication
* Prepared images for Kubernetes deployment
* Separated build and deployment concerns

---

## Key Takeaways

* ECR acts as the bridge between Docker and Kubernetes
* Versioned images are critical for safe deployments
* Security scanning is an important DevSecOps practice
* Proper tagging enables easy rollback and traceability

---

