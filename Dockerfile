# 1. 使用官方 Node.js 22 slim 版本作為基礎映像
FROM node:22-slim

# 2. 設定在容器內的工作目錄
WORKDIR /app

# 3. 複製依賴性檔案
#    只複製這兩個檔案是為了利用 Docker 的快取機制，只要它們不變，就不用重新安裝套件
COPY package.json package-lock.json* ./

# 4. 安裝應用程式依賴
#    在 CI/CD 環境中，使用 npm ci 可以確保依賴版本一致性，且通常速度更快
RUN npm ci --only=production

# 5. 複製您專案中所有剩餘的程式碼 (例如 server.cjs, index.cjs 等)
COPY . .

# 6. 暴露容器的 5000 端口
#    這是一個給 Cloud Run 的提示，告訴它您的應用程式在這個端口上監聽
EXPOSE 5000

# 7. 啟動應用程式
#    這個指令會執行您 package.json 中 "scripts" 裡的 "start" 指令
CMD ["npm", "start"]
