# AWS Production Deployment Guide

This guide details how to deploy the Multi-Vendor E-Commerce monorepo onto Amazon Web Services (AWS) using EC2, S3, CloudFront, Application Load Balancers, Route53, and Docker.

---

## 1. Hosting the React Frontend (S3 + CloudFront)

For high performance, the React frontend should be served as static files directly from S3 and accelerated via CloudFront CDN.

### Step 1: Create S3 Bucket
1. Go to the **S3 Console** and click **Create bucket**.
2. Name the bucket (e.g., `my-marketplace-frontend`).
3. Enable **Static website hosting** under the **Properties** tab.
4. Set index and error documents to `index.html`.

### Step 2: Configure CloudFront CDN
1. Go to the **CloudFront Console** and click **Create distribution**.
2. Set the **Origin domain** to the S3 bucket website hosting endpoint.
3. Under **Default cache behavior**, select **Redirect HTTP to HTTPS**.
4. Set **Viewer Protocol Policy** to HTTPS.
5. Save and deploy. CloudFront will provide a URL (e.g. `d12345.cloudfront.net`) which serves the React app with low latency.

---

## 2. Deploying Backend Microservices (EC2 + Docker Compose)

The backend microservices and databases run inside Docker containers on AWS EC2.

### Step 1: Launch EC2 Instance
1. Launch an EC2 Instance (Recommended: `t3.medium` or larger to run multiple containers).
2. Use **Amazon Linux 2023** or **Ubuntu Server 22.04 LTS**.
3. In Security Groups, expose ports:
   - `80` (HTTP) and `443` (HTTPS)
   - `22` (SSH)

### Step 2: Install Docker & Docker Compose
Connect to your EC2 instance via SSH and run:
```bash
# Update packages
sudo apt-get update -y

# Install Docker
sudo apt-get install docker.io -y
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker ubuntu

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.24.5/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### Step 3: Run Containers
Clone the repository to the EC2 instance, populate environmental variables in `.env`, and start the containers:
```bash
docker-compose -f docker-compose.yml up -d --build
```

---

## 3. SSL, Domain, and Load Balancing (Route53 + ALB + ACM)

### Step 1: Request SSL Certificate
1. Go to **AWS Certificate Manager (ACM)**.
2. Request a public certificate for your domain name (e.g. `api.yourdomain.com` and `yourdomain.com`).
3. Validate ownership using Route53 DNS.

### Step 2: Configure Application Load Balancer (ALB)
1. Create an ALB in the EC2 Console.
2. Configure listeners:
   - **HTTP (Port 80)**: Redirects to HTTPS (Port 443).
   - **HTTPS (Port 443)**: Select the SSL certificate from ACM. Forward requests to the EC2 target group forwarding to the API Gateway port `8000`.

### Step 3: Configure Route53 DNS Routing
1. Create a **Hosted Zone** in Route53 for your domain.
2. Add an **A Record** (Alias) routing `yourdomain.com` to the CloudFront distribution.
3. Add an **A Record** (Alias) routing `api.yourdomain.com` to the Application Load Balancer.

---

## 4. Media Storage (S3 + Cloudinary)

For production, local disk file uploads under `/uploads` should be mapped to S3.
1. Create an S3 Bucket named `my-marketplace-media`.
2. Configure bucket policies to allow public reads on objects.
3. Set the following environmental parameters in the microservices (`.env`):
   ```env
   AWS_ACCESS_KEY_ID=your_key_id
   AWS_SECRET_ACCESS_KEY=your_secret
   AWS_S3_BUCKET_NAME=my-marketplace-media
   ```
