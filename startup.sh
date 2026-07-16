pm2 kill 2>/dev/null
sudo pkill -9 -f "next" 2>/dev/null
sudo fuser -k 4028/tcp 2>/dev/null
sleep 3

# 2. Start with PM2 on 0.0.0.0
pm2 start npx --name sniperbot -- next dev -H 0.0.0.0 -p 4028
sleep 3

# 3. Check binding
sudo netstat -tlnp | grep 4028

# 4. View logs
pm2 logs sniperbot --lines 10

# 5. Save and setup auto-start
pm2 save
pm2 startup | tail -1 | bash

# 6. Test
curl http://127.0.0.1:4028
curl -I https://sniperbot.space