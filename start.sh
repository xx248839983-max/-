#!/bin/bash
echo "=== 投资助手启动中 ==="

# 后端
cd backend
echo "[1/3] 安装 Python 依赖..."
pip install -r requirements.txt -q
echo "[2/3] 启动后端 (端口 8000)..."
python main.py &
BACKEND_PID=$!
cd ..

sleep 2

# 前端
echo "[3/3] 启动前端 (端口 5173)..."
npm install -q
npm run dev

kill $BACKEND_PID 2>/dev/null
