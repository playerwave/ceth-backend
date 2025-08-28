# echo "Deploying backend..."

# # Sync all necessary files for the container
# rsync -avz --exclude 'node_modules' --exclude 'dist' --exclude '.git' ./ wave@vps.theapds.org:~/ceth-backend/

# # Sync docker-compose.yml separately to ensure it's updated
# rsync -avz ./docker-compose.yml wave@vps.theapds.org:~/ceth-backend/

# echo "Deployed backend"

echo "Deploying backend..."

# Sync files
rsync -avz --exclude 'node_modules' --exclude 'dist' --exclude '.git' ./ wave@vps.theapds.org:~/ceth-backend/
rsync -avz ./docker-compose.yml wave@vps.theapds.org:~/ceth-backend/

echo "Files synced. Restarting containers on VPS..."

# SSH into VPS and restart containers
ssh wave@vps.theapds.org << 'EOF'
cd ~/ceth-backend
echo "Stopping containers..."
docker compose down
echo "Rebuilding containers..."
docker compose build --no-cache
echo "Starting containers..."
docker compose up -d
echo "Containers restarted successfully!"
EOF

echo "Deployment completed!"