#!/bin/bash

# === CONFIGURABLE ===
PROJECT_ID=$(gcloud config get-value project)
ZONE="asia-south1-c"
VM_NAME="odoofinallarge-vm"
MACHINE_TYPE="e2-standard-2"
LOCAL_DIR="$(pwd)"
REMOTE_DIR="/home/$(whoami)/odoofinal"
DISK_SIZE="30GB"

echo "🚀 Creating VM instance with HTTP/2 support..."
# gcloud compute instances create "$VM_NAME" \
#   --project="$PROJECT_ID" \
#   --zone="$ZONE" \
#   --machine-type="$MACHINE_TYPE" \
#   --image-family=debian-11 \
#   --image-project=debian-cloud \
#   --boot-disk-size="$DISK_SIZE" \
#   --tags=http-server,https-server \
#   --quiet

# echo "🔐 Opening HTTP/HTTPS/HTTP2 firewall..."
# gcloud compute firewall-rules create allow-http-https-http2 \
#   --allow tcp:80,tcp:443,tcp:3000-3200,tcp:9200,tcp:9300,tcp:9090 \
#   --target-tags=http-server,https-server \
#   --description="Allow HTTP, HTTPS, HTTP/2 and other ports for demo stack" \
#   --quiet || true

# echo "🪝 Installing Docker & Docker Compose..."
# gcloud compute ssh "$VM_NAME" --zone="$ZONE" --command '
#   sudo apt update &&
#   sudo apt install -y docker.io docker-compose-v2 &&
#   sudo usermod -aG docker $USER &&
#   sudo systemctl enable docker &&
#   sudo systemctl start docker
# '

echo "📦 Uploading local project to VM..."
gcloud compute scp --recurse "$LOCAL_DIR" "$VM_NAME:$REMOTE_DIR" --zone="$ZONE"

echo "� Setting up environment and building containers..."
gcloud compute ssh "$VM_NAME" --zone="$ZONE" --command "
  cd $REMOTE_DIR && pnpm install && npx prisma generate && 
  sudo docker compose down || true &&
  sudo docker compose -f docker-compose.prod.yml up --build -d
"

echo "🌐 Fetching public IP..."
VM_IP=$(gcloud compute instances describe "$VM_NAME" --zone="$ZONE" --format='get(networkInterfaces[0].accessConfigs[0].natIP)')

echo "⏳ Waiting for services to be ready..."
sleep 30

echo "✅ Deployment complete!"
echo ""
echo "🔗 Your application URLs:"
echo "   HTTP/2 Application: http://${VM_IP}:3000"
echo "   Grafana Dashboard: http://${VM_IP}:3001"
echo "   Prometheus: http://${VM_IP}:9090"
echo "   Elasticsearch: http://${VM_IP}:9200"
echo ""
echo "📊 To check HTTP/2 support:"
echo "   curl -I --http2 http://${VM_IP}:3000"
echo ""
echo "🔧 To connect to VM:"
echo "   gcloud compute ssh $VM_NAME --zone=$ZONE"
echo ""
echo "📋 To view logs:"
echo "   gcloud compute ssh $VM_NAME --zone=$ZONE --command 'cd $REMOTE_DIR && sudo docker compose -f docker-compose.prod.yml logs -f odoofinal'"
