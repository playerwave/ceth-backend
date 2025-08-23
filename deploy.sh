echo "Deploying backend..."

# Sync all necessary files for the container
rsync -avz --exclude 'node_modules' --exclude 'dist' --exclude '.git' ./ wave@vps.theapds.org:~/ceth-backend/

# Sync docker-compose.yml separately to ensure it's updated
rsync -avz ./docker-compose.yml wave@vps.theapds.org:~/ceth-backend/

echo "Deployed backend"