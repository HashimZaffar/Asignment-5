# Blue/Green Traffic Shifting Notes

## Project Context

This document explains the blue/green traffic shifting process used in this project.

The project deploys a Node.js application on AWS EKS using Kubernetes, AWS Load Balancer Controller, and an Application Load Balancer.

Two versions of the application were deployed:

```text
Blue  = version v1
Green = version v2
````

The purpose of this setup is to release a new version safely without downtime.

---

## Current Architecture

```text
User
  ↓
AWS Application Load Balancer
  ↓
Kubernetes Ingress
  ↓
Weighted Routing
  ↓
Blue Service / Green Service
  ↓
Blue Pods / Green Pods
```

---

## Components Used

### Blue Deployment

The blue deployment runs the stable version of the application.

```text
Deployment: blue-app
Service: blue-service
Version: v1
Color: blue
```

### Green Deployment

The green deployment runs the new version of the application.

```text
Deployment: green-app
Service: green-service
Version: v2
Color: green
```

### AWS Load Balancer Controller

The AWS Load Balancer Controller watches the Kubernetes Ingress resource and creates or updates the AWS Application Load Balancer.

### Ingress Weighted Routing

The Ingress resource uses AWS ALB annotations to split traffic between blue and green services.

---

## Traffic Shift Stages

### Stage 1 — Initial Blue Deployment

At the start, all traffic goes to the blue version.

```text
Blue: 100%
Green: 0%
```

Expected response:

```json
{
  "version": "v1",
  "color": "blue"
}
```

---

### Stage 2 — Small Green Release

A small amount of traffic is sent to the green version.

```text
Blue: 90%
Green: 10%
```

Purpose:

```text
Test the new version with limited user traffic.
Reduce risk if the new version has an issue.
Keep the stable blue version active.
```

Apply command:

```bash
kubectl apply -f ingress-90-blue-10-green.yaml
```

---

### Stage 3 — Balanced Traffic Split

If green is healthy, traffic is increased.

```text
Blue: 50%
Green: 50%
```

Purpose:

```text
Observe green version under more traffic.
Compare behaviour between blue and green.
Continue safe rollout.
```

Apply command:

```bash
kubectl apply -f ingress-50-blue-50-green.yaml
```

---

### Stage 4 — Full Green Release

After successful validation, all traffic is moved to green.

```text
Blue: 0%
Green: 100%
```

Purpose:

```text
Complete the release.
Make green v2 the active production version.
Keep blue available for rollback if required.
```

Apply command:

```bash
kubectl apply -f ingress-0-blue-100-green.yaml
```

Confirmed output:

```json
{
  "message": "Hello from Blue/Green Deployment Demo",
  "version": "v2",
  "color": "green",
  "status": "healthy"
}
```

---

## Rollback Strategy

If the green version fails, traffic can be moved back to blue.

Rollback target:

```text
Blue: 100%
Green: 0%
```

Apply command:

```bash
kubectl apply -f ingress-rollback-100-blue.yaml
```

Expected response after rollback:

```json
{
  "version": "v1",
  "color": "blue"
}
```

This rollback is fast because the blue deployment remains running while green is being tested.

---

## Testing Commands

Save ALB DNS:

```bash
export ALB_DNS=$(kubectl get ingress bluegreen-ingress \
  -n bluegreen \
  -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')
```

Check ALB DNS:

```bash
echo $ALB_DNS
```

Test current traffic:

```bash
curl http://$ALB_DNS
```

Run multiple requests:

```bash
for i in {1..20}; do curl -s http://$ALB_DNS; echo; echo "-----"; done
```

Check Kubernetes resources:

```bash
kubectl get pods -n bluegreen
kubectl get svc -n bluegreen
kubectl get ingress -n bluegreen
```

---

## Important Observation

ALB routing changes are not always instant.

After applying a new Ingress file, AWS Load Balancer Controller needs time to reconcile the Kubernetes Ingress with the AWS ALB listener rules.

Recommended wait time:

```text
60 to 90 seconds
```

Example:

```bash
sleep 90
for i in {1..20}; do curl -s http://$ALB_DNS; echo; echo "-----"; done
```

---

## Failure Simulation

A green failure can be simulated by scaling green pods to zero:

```bash
kubectl scale deployment green-app --replicas=0 -n bluegreen
```

Check pods:

```bash
kubectl get pods -n bluegreen
```

Rollback to blue:

```bash
kubectl apply -f ingress-rollback-100-blue.yaml
```

Restore green:

```bash
kubectl scale deployment green-app --replicas=2 -n bluegreen
```

---

## Why This Strategy Is Useful

Blue/Green deployment reduces release risk.

It allows teams to:

```text
Deploy a new version without stopping the old version.
Test the new version with small traffic first.
Increase traffic gradually.
Rollback quickly if something fails.
Avoid downtime during deployment.
```

---

## Lessons Learned

```text
Blue is the stable version.
Green is the new version.
Both versions can run at the same time.
ALB weighted routing controls traffic percentage.
Rollback is done by shifting traffic back to blue.
AWS Load Balancer Controller may take some time to update ALB rules.
```

---

## Final Result

The project successfully demonstrated:

```text
Node.js application deployment on EKS
Two application versions: v1 and v2
AWS ALB exposure using Ingress
Gradual traffic shifting
Blue/Green release strategy
Rollback on failure
```

Final successful state:

```text
Blue: 0%
Green: 100%
```

Final response:

```json
{
  "version": "v2",
  "color": "green",
  "status": "healthy"
}
```
